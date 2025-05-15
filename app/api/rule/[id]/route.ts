import { NextResponse } from "next/server";
import type { AdRule } from "../types";

// Helper function to validate environment variables
function validateEnv(): { isValid: boolean; error?: string } {
  const accessToken = process.env.FB_ACCESS_TOKEN;
  const accountId = process.env.FB_ACCOUNT_ID;
  const apiVersion = process.env.FB_API_VERSION;

  if (!accessToken || !accountId || !apiVersion) {
    return {
      isValid: false,
      error: "Missing required environment variables",
    };
  }
  return { isValid: true };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const envCheck = validateEnv();
  if (!envCheck.isValid) {
    return NextResponse.json({ error: envCheck.error }, { status: 500 });
  }

  const { id } = params;

  try {
    // Direct API call to get rule details
    const accessToken = process.env.FB_ACCESS_TOKEN;
    const apiVersion = process.env.FB_API_VERSION;

    // Construct URL directly for GET request
    const fields =
      "name,status,schedule_spec,execution_spec,evaluation_spec,created_time,created_by,account_id";
    const directUrl = `https://graph.facebook.com/${apiVersion}/${id}?access_token=${accessToken}&fields=${fields}`;
    console.log("Get single rule URL:", directUrl);

    const response = await fetch(directUrl);

    if (!response.ok) {
      throw new Error(`Error fetching rule: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    return NextResponse.json(
      { error: "Failed to fetch rule", details: message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const envCheck = validateEnv();
  if (!envCheck.isValid) {
    return NextResponse.json({ error: envCheck.error }, { status: 500 });
  }

  const { id } = params;
  console.log("Rule ID for update:", id);

  try {
    const bodyData = await request.json();
    console.log("PATCH [id] - Received request body:", bodyData);

    // Format the update data similar to how we do it in the main POST endpoint
    const updateData: Partial<AdRule> = {
      name: bodyData.name,
      evaluation_spec: bodyData.evaluation_spec,
      execution_spec: {
        execution_type: bodyData.execution_spec.execution_type,
        // Add execution_options if subscribers are provided
        ...(bodyData.subscribers &&
          bodyData.subscribers.length > 0 && {
            execution_options: [
              {
                field: "user_ids",
                value: bodyData.subscribers,
                operator: "EQUAL",
              },
              {
                field: "alert_preferences",
                value: {
                  instant: {
                    trigger: "CHANGE",
                  },
                },
                operator: "EQUAL",
              },
            ],
          }),
      },
      schedule_spec: {
        schedule_type:
          bodyData.schedule_spec.schedule_type === "CONTINUOUSLY"
            ? "SEMI_HOURLY"
            : bodyData.schedule_spec.schedule_type,
        ...(bodyData.schedule_spec.time && {
          time: bodyData.schedule_spec.time,
        }),
      },
    };

    console.log(
      "Sending update to Facebook API:",
      JSON.stringify(updateData, null, 2)
    );

    // Direct access to the Facebook API
    const accessToken = process.env.FB_ACCESS_TOKEN;
    const apiVersion = process.env.FB_API_VERSION;

    // Try plain rule ID (may be a Facebook object ID)
    const directUrl = `https://graph.facebook.com/${apiVersion}/${id}?access_token=${accessToken}`;
    console.log("Update URL:", directUrl);

    const response = await fetch(directUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(
        "Facebook API error (PATCH [id]):",
        errorData,
        "Status:",
        response.status
      );
      console.error("Request URL:", directUrl);
      console.error("Request body:", JSON.stringify(updateData));

      // If we got a specific error about path components, let's try the account ID approach
      if (errorData?.error?.message?.includes("Unknown path components")) {
        console.log("Trying alternative update approach with account ID...");
        const accountId = process.env.FB_ACCOUNT_ID;

        // For ad rules, try with the ad account ID prefix
        const alternateUrl = `https://graph.facebook.com/${apiVersion}/act_${accountId}/adrules_library?access_token=${accessToken}`;
        console.log("Alternative Update URL:", alternateUrl);

        // Include the ID in the update data
        const alternateUpdateData = {
          ...updateData,
          id: id,
        };

        const alternateResponse = await fetch(alternateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(alternateUpdateData),
        });

        if (!alternateResponse.ok) {
          const altErrorData = await alternateResponse.json().catch(() => null);
          console.error("Alternative approach error:", altErrorData);
          throw new Error(
            `Error updating rule [${id}] (alternative approach): ${
              alternateResponse.statusText
            }. Status: ${alternateResponse.status}. Details: ${JSON.stringify(
              altErrorData
            )}`
          );
        }

        const data = await alternateResponse.json();
        return NextResponse.json(data);
      }

      throw new Error(
        `Error updating rule [${id}]: ${response.statusText}. Status: ${
          response.status
        }. Details: ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    console.log(error);
    return NextResponse.json(
      { error: "Failed to update rule", details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const envCheck = validateEnv();
  if (!envCheck.isValid) {
    return NextResponse.json({ error: envCheck.error }, { status: 500 });
  }

  const { id } = params;
  console.log("DELETE - Rule ID:", id);

  try {
    // Direct API call for deletion
    const accessToken = process.env.FB_ACCESS_TOKEN;
    const apiVersion = process.env.FB_API_VERSION;

    // Construct URL directly for DELETE request
    const directUrl = `https://graph.facebook.com/${apiVersion}/${id}?access_token=${accessToken}`;
    console.log("Delete URL:", directUrl);

    const response = await fetch(directUrl, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Facebook API error (DELETE [id]):", errorData);
      throw new Error(
        `Error deleting rule: ${response.statusText}. Details: ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    return NextResponse.json(
      { error: "Failed to delete rule", details: message },
      { status: 500 }
    );
  }
}
