import { NextResponse } from "next/server";
import type { AdRule, ApiResponse } from "./types";

// Helper function to get Facebook API URL
function getFacebookApiUrl(path: string = ""): string {
  const accessToken = process.env.FB_ACCESS_TOKEN;
  const accountId = process.env.FB_ACCOUNT_ID;
  const apiVersion = process.env.FB_API_VERSION;

  return `https://graph.facebook.com/${apiVersion}/act_${accountId}${path}?access_token=${accessToken}`;
}

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

// GET - Fetch all ad rules
export async function GET(request: Request) {
  const envCheck = validateEnv();
  if (!envCheck.isValid) {
    return NextResponse.json({ error: envCheck.error }, { status: 500 });
  }

  try {
    const url = getFacebookApiUrl("/adrules_library");
    const response = await fetch(
      `${url}&fields=name,status,schedule_spec,execution_spec,evaluation_spec,created_time,created_by,account_id`
    );

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    return NextResponse.json(
      { error: "Failed to fetch data", details: message },
      { status: 500 }
    );
  }
}

// POST - Create new ad rule
export async function POST(request: Request) {
  const envCheck = validateEnv();
  if (!envCheck.isValid) {
    return NextResponse.json({ error: envCheck.error }, { status: 500 });
  }

  try {
    const body = await request.json();
    console.log("Received request body:", body); // Add logging to debug the incoming data

    // Validate required fields
    if (
      !body.name ||
      !body.evaluation_spec ||
      !body.execution_spec ||
      !body.schedule_spec
    ) {
      return NextResponse.json(
        { error: "Missing required fields in request body" },
        { status: 400 }
      );
    }

    // Format the adRule to match the Facebook API requirements
    const adRule: AdRule = {
      name: body.name,
      evaluation_spec: body.evaluation_spec,
      execution_spec: {
        execution_type: body.execution_spec.execution_type,
        // Add execution_options if subscribers are provided
        ...(body.subscribers &&
          body.subscribers.length > 0 && {
            execution_options: [
              {
                field: "user_ids",
                value: body.subscribers,
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
          body.schedule_spec.schedule_type === "CONTINUOUSLY"
            ? "SEMI_HOURLY"
            : body.schedule_spec.schedule_type,
        ...(body.schedule_spec.time && { time: body.schedule_spec.time }),
      },
      status: "ENABLED",
    };

    console.log("Sending to Facebook API:", JSON.stringify(adRule, null, 2));

    const url = getFacebookApiUrl("/adrules_library");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(adRule),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Facebook API error:", errorData); // Add logging for API errors
      throw new Error(
        `Error creating rule: ${response.statusText}. Details: ${JSON.stringify(
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
      { error: "Failed to create rule", details: message },
      { status: 500 }
    );
  }
}

// PATCH - Update existing ad rule
export async function PATCH(request: Request) {
  const envCheck = validateEnv();
  if (!envCheck.isValid) {
    return NextResponse.json({ error: envCheck.error }, { status: 500 });
  }

  try {
    const body: AdRule & { id: string } = await request.json();
    console.log("PATCH - Received request body:", body); // Add logging to debug the incoming data

    if (!body.id) {
      return NextResponse.json(
        { error: "Missing rule ID in request body" },
        { status: 400 }
      );
    }

    // Extract ID and format the update data to match Facebook API requirements
    const { id, ...bodyData } = body;

    // Format the update data similar to how we do it in POST
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

    const url = getFacebookApiUrl(`/adrules_library/${id}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Facebook API error (PATCH):", errorData); // Add logging for API errors
      throw new Error(
        `Error updating rule: ${response.statusText}. Details: ${JSON.stringify(
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
      { error: "Failed to update rule", details: message },
      { status: 500 }
    );
  }
}

// DELETE - Remove ad rule
export async function DELETE(request: Request) {
  const envCheck = validateEnv();
  if (!envCheck.isValid) {
    return NextResponse.json({ error: envCheck.error }, { status: 500 });
  }

  try {
    const body = await request.json();
    console.log("DELETE - Received request body:", body);

    if (!body.id) {
      return NextResponse.json(
        { error: "Missing rule ID in request body" },
        { status: 400 }
      );
    }

    const url = getFacebookApiUrl(`/adrules_library/${body.id}`);
    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Facebook API error (DELETE):", errorData);
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
