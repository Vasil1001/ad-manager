"use client";

import { useState, useEffect } from "react";
import { AdRule } from "../app/api/types";

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: AdRule) => void;
  initialData?: AdRule & { id: string };
}

export default function RuleModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: RuleModalProps) {
  const [formData, setFormData] = useState<AdRule>({
    name: "",
    evaluation_spec: {
      evaluation_type: "SCHEDULE",
      filters: [
        {
          field: "ad.name", // Changed from "name" to "ad.name" to match API format
          operator: "CONTAIN",
          value: "TEST",
        },
        {
          field: "spent", // Changed from "spend" to "spent" to match API format
          operator: "GREATER_THAN",
          value: 20,
        },
        {
          field: "entity_type", // Added this required field
          value: "AD",
          operator: "EQUAL",
        },
        {
          field: "time_preset", // Added this field for time range
          value: "LAST_30D",
          operator: "EQUAL",
        },
      ],
    },
    execution_spec: {
      execution_type: "PAUSE",
    },
    schedule_spec: {
      schedule_type: "DAILY",
      time: "00:00",
    },
  });

  // Additional state for notification and subscribers
  const [notifications, setNotifications] = useState({
    onFacebook: true,
  });

  const [subscribers, setSubscribers] = useState<string[]>([]);

  // Time range state
  const [timeRange, setTimeRange] = useState("30");
  const [timeRangeLabel, setTimeRangeLabel] = useState("Last 30 days");

  // Function to handle time range selection
  const handleTimeRangeChange = (value: string, label: string) => {
    setTimeRange(value);
    setTimeRangeLabel(label);
    // Hide dropdown after selection
    document.getElementById("time-dropdown")?.classList.add("hidden");
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);

      // Set notifications if available in initialData
      if (initialData.notifications) {
        setNotifications(initialData.notifications);
      }

      // Set subscribers if available in initialData
      if (initialData.subscribers && Array.isArray(initialData.subscribers)) {
        setSubscribers(initialData.subscribers);
      }

      // Check if there are execution_options with user_ids in the existing rule
      if (
        initialData.execution_spec &&
        initialData.execution_spec.execution_options &&
        Array.isArray(initialData.execution_spec.execution_options)
      ) {
        const userIdsOption = initialData.execution_spec.execution_options.find(
          (option) => option.field === "user_ids"
        );

        if (userIdsOption && Array.isArray(userIdsOption.value)) {
          setSubscribers(userIdsOption.value as string[]);
        }
      }
    }
  }, [initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule_spec: {
        ...prev.schedule_spec,
        schedule_type: type,
      },
    }));
  };

  const handleFilterChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newFilters = [...formData.evaluation_spec.filters];
    newFilters[index] = { ...newFilters[index], [field]: value };

    setFormData((prev) => ({
      ...prev,
      evaluation_spec: {
        ...prev.evaluation_spec,
        filters: newFilters,
      },
    }));
  };

  const handleActionChange = (action: string) => {
    setFormData((prev) => ({
      ...prev,
      execution_spec: {
        ...prev.execution_spec,
        execution_type: action,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ruleData = {
      ...formData,
      notifications: notifications,
      subscribers: subscribers,
    };
    onSave(ruleData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {initialData ? "Edit Rule" : "Create a custom rule"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Automatically update the settings of selected campaigns, ad sets or
          ads by creating a rule.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-gray-700 font-medium mb-2">Rule name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Rule name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-gray-700 font-medium mb-2">
                Apply rule to
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="all_active">All active ad sets</option>
                <option value="specific_campaigns">Specific campaigns</option>
                <option value="specific_adsets">Specific ad sets</option>
                <option value="specific_ads">Specific ads</option>
              </select>
              <div className="mt-2 text-sm text-gray-500 flex items-center">
                <span className="mr-2">💡</span>
                <span>
                  Your rule will apply to ad sets that are active at the time
                  the rule runs.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Action
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.execution_spec.execution_type}
                onChange={(e) => handleActionChange(e.target.value)}
              >
                <option value="PAUSE">Pause ads</option>
                <option value="ACTIVATE">Turn on ads</option>
                <option value="REBALANCE_BUDGET">Adjust budget</option>
                <option value="ROTATE_CREATIVE">Rotate creative</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-gray-700 font-medium mb-2 flex items-center">
              Conditions
              <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-1">
                i
              </span>
            </label>
            <div className="border border-gray-300 rounded-md p-3 mb-2">
              <div className="text-sm mb-2">All of the following match</div>

              {formData.evaluation_spec.filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={filter.field}
                    onChange={(e) =>
                      handleFilterChange(index, "field", e.target.value)
                    }
                  >
                    <option value="ad.name">Name</option>
                    <option value="spent">Spent</option>
                    <option value="impressions">Impressions</option>
                    <option value="clicks">Clicks</option>
                    <option value="entity_type">Entity Type</option>
                    <option value="time_preset">Time Preset</option>
                  </select>

                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={filter.operator}
                    onChange={(e) =>
                      handleFilterChange(index, "operator", e.target.value)
                    }
                  >
                    <option value="CONTAIN">contains</option>
                    <option value="EQUAL">equals</option>
                    <option value="GREATER_THAN">is greater than</option>
                    <option value="LESS_THAN">is less than</option>
                  </select>

                  <input
                    type={typeof filter.value === "number" ? "number" : "text"}
                    value={
                      filter.field === "spent"
                        ? Number(filter.value) / 100
                        : filter.value.toString()
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        index,
                        "value",
                        filter.field === "spent"
                          ? parseFloat(e.target.value) * 100
                          : typeof filter.value === "number"
                          ? parseFloat(e.target.value)
                          : e.target.value
                      )
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md flex-grow"
                    step={filter.field === "spent" ? "0.01" : "1"}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-gray-700 font-medium mb-2 flex items-center">
              Time range
              <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-1">
                i
              </span>
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white flex justify-between items-center"
                onClick={() =>
                  document
                    .getElementById("time-dropdown")
                    ?.classList.toggle("hidden")
                }
              >
                <span>{timeRangeLabel}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div
                id="time-dropdown"
                className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-72 overflow-y-auto hidden"
              >
                <div className="p-2">
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="radio"
                        name="time_range"
                        className="mr-2"
                        value="37"
                        onChange={() =>
                          handleTimeRangeChange("37", "37 months (Maximum)")
                        }
                      />
                      <span>37 months (Maximum)</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="radio"
                        name="time_range"
                        className="mr-2"
                        value="today"
                        onChange={() => handleTimeRangeChange("today", "Today")}
                      />
                      <span>Today</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="radio"
                        name="time_range"
                        className="mr-2"
                        value="yesterday"
                        onChange={() =>
                          handleTimeRangeChange("yesterday", "Yesterday")
                        }
                      />
                      <span>Yesterday</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="radio"
                        name="time_range"
                        className="mr-2"
                        value="2"
                        onChange={() =>
                          handleTimeRangeChange("2", "Last 2 days")
                        }
                      />
                      <span>Last 2 days</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="radio"
                        name="time_range"
                        className="mr-2"
                        value="3"
                        onChange={() =>
                          handleTimeRangeChange("3", "Last 3 days")
                        }
                      />
                      <span>Last 3 days</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="radio"
                        name="time_range"
                        className="mr-2"
                        value="7"
                        onChange={() =>
                          handleTimeRangeChange("7", "Last 7 days")
                        }
                      />
                      <span>Last 7 days</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="radio"
                        name="time_range"
                        className="mr-2"
                        value="14"
                        onChange={() =>
                          handleTimeRangeChange("14", "Last 14 days")
                        }
                      />
                      <span>Last 14 days</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="radio"
                        name="time_range"
                        className="mr-2"
                        value="28"
                        onChange={() =>
                          handleTimeRangeChange("28", "Last 28 days")
                        }
                      />
                      <span>Last 28 days</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded bg-blue-50">
                      <input
                        type="radio"
                        name="time_range"
                        className="mr-2"
                        value="30"
                        checked
                        onChange={() =>
                          handleTimeRangeChange("30", "Last 30 days")
                        }
                      />
                      <span>Last 30 days</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-gray-700 font-medium mb-2 flex items-center">
              Schedule
              <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-1">
                i
              </span>
            </label>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="continuously"
                  name="schedule_type"
                  checked={
                    formData.schedule_spec.schedule_type === "CONTINUOUSLY"
                  }
                  onChange={() => handleScheduleTypeChange("CONTINUOUSLY")}
                  className="mr-2"
                />
                <label htmlFor="continuously">
                  <div className="font-medium">Continuously</div>
                  <div className="text-sm text-gray-500">
                    Rule runs as often as possible (usually every 30-60
                    minutes).
                  </div>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="daily"
                  name="schedule_type"
                  checked={formData.schedule_spec.schedule_type === "DAILY"}
                  onChange={() => handleScheduleTypeChange("DAILY")}
                  className="mr-2"
                />
                <label htmlFor="daily">
                  <div className="font-medium">Daily</div>
                  <div className="text-sm text-gray-500">
                    between 12:00AM and 01:00AM London Time
                  </div>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="custom"
                  name="schedule_type"
                  checked={formData.schedule_spec.schedule_type === "CUSTOM"}
                  onChange={() => handleScheduleTypeChange("CUSTOM")}
                  className="mr-2"
                />
                <label htmlFor="custom">
                  <div className="font-medium">Custom</div>
                  <div className="text-sm text-gray-500">
                    Adjust rule schedule to run on specific days and specific
                    times of the day. If start and end time are the same then
                    the rule will run once per day within 30-60 minutes after
                    the set time. All times are in London Time
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Notification section */}
          <div className="mb-6">
            <label className="text-gray-700 font-medium mb-2 flex items-center">
              Notification
              <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-1">
                i
              </span>
            </label>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="onFacebook"
                checked={notifications.onFacebook}
                onChange={() =>
                  setNotifications((prev) => ({
                    ...prev,
                    onFacebook: !prev.onFacebook,
                  }))
                }
                className="mr-2"
              />
              <label htmlFor="onFacebook">
                <div className="font-medium">On Facebook</div>
                <div className="text-sm text-gray-500">
                  You&apos;ll receive a notification when conditions for this
                  rule have been met.
                </div>
              </label>
            </div>
          </div>

          {/* Subscriber section */}
          <div className="mb-6">
            <label className="text-gray-700 font-medium mb-2 flex items-center">
              Subscriber
              <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-1">
                i
              </span>
            </label>

            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded-md p-2">
                <svg
                  className="w-4 h-4 text-gray-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <div className="flex flex-wrap gap-1">
                  {subscribers.map((subscriber, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 px-2 py-1 rounded-md flex items-center text-sm"
                    >
                      {subscriber}
                      <button
                        onClick={() =>
                          setSubscribers((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    placeholder="Add subscribers"
                    className="flex-grow outline-none text-sm px-2 py-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        setSubscribers((prev) => [
                          ...prev,
                          e.currentTarget.value.trim(),
                        ]);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {initialData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
