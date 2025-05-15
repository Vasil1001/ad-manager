"use client";

import { useState, useEffect } from "react";
// Interface for rule history entries returned by the API
interface HistoryEntry {
  is_manual: boolean;
  timestamp: string;
  results: unknown[];
}
// Format timestamp string from API (e.g., '2025-05-15T11:03:42+0000')
function formatTimestamp(ts: string): string {
  // Insert colon in timezone offset if missing (e.g., +0000 -> +00:00)
  const fixed = ts.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const d = new Date(fixed);
  return isNaN(d.getTime()) ? ts : d.toLocaleString();
}
import { AdRule } from "../app/api/types";
import { ChevronDown } from "lucide-react";

interface RulesTableProps {
  rules: AdRule[];
  onEdit: (rule: AdRule & { id: string }) => void;
  onDelete: (id: string) => void;
  onToggleStatus?: (rule: AdRule & { id: string }) => void;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function RulesTable({
  rules,
  onEdit,
  onDelete,
  onToggleStatus,
}: RulesTableProps) {
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [previewRule, setPreviewRule] = useState<string | null>(null);
  const [historyRule, setHistoryRule] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  // Fetch history when historyRule changes
  useEffect(() => {
    if (!historyRule) {
      setHistoryData([]);
      setHistoryError(null);
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    fetch(`/api/rule/${historyRule}/history?hide_no_changes=true`)
      .then((res) => res.json())
      .then((json) => {
        console.log('History API response:', json);
        if (json.error) {
          const msg = json.details?.message || json.error;
          setHistoryError(typeof msg === 'string' ? msg : JSON.stringify(msg));
          setHistoryData([]);
        } else {
          setHistoryData(Array.isArray(json.data) ? json.data : []);
        }
      })
      .catch((err) => {
        setHistoryError(err.message);
        setHistoryData([]);
      })
      .finally(() => setHistoryLoading(false));
  }, [historyRule]);

  const toggleSelectAll = () => {
    if (selectedRules.length === rules.length) {
      setSelectedRules([]);
    } else {
      setSelectedRules(rules.map((rule) => rule.id || "").filter(Boolean));
    }
  };

  const toggleSelectRule = (id: string) => {
    if (selectedRules.includes(id)) {
      setSelectedRules(selectedRules.filter((ruleId) => ruleId !== id));
    } else {
      setSelectedRules([...selectedRules, id]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex">
        <div
          className={`flex-1 transition-all ${
            previewRule || historyRule ? "w-2/3" : "w-full"
          }`}
        >
          <table className="min-w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th scope="col" className="pl-6 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedRules.length === rules.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                >
                  Rule Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                >
                  Applied to
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                >
                  Action & condition
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                >
                  Rule results
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                >
                  When rule runs
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                >
                  Created by
                </th>
                <th
                  scope="col"
                  className="pr-6 py-4 text-right text-sm font-semibold text-gray-900"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No rules found
                  </td>
                </tr>
              ) : (
                rules
                  .filter((rule): rule is AdRule & { id: string } => !!rule.id)
                  .map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="pl-6 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedRules.includes(rule.id)}
                          onChange={() => toggleSelectRule(rule.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                            <svg
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {rule.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Rule ID: {rule.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Toggle
                          checked={rule.status === "ACTIVE"}
                          onChange={() => onToggleStatus?.(rule)}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        All active ads
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rule.execution_spec?.execution_type || "PAUSE"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {rule.evaluation_spec?.filters?.[0]?.field}:{" "}
                          {rule.evaluation_spec?.filters?.[0]?.value}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-blue-600">No changes to ads</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        Every 30 minutes
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {(rule as any).created_by?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {rule.created_time
                            ? new Date(rule.created_time).toLocaleDateString()
                            : "-"}
                        </div>
                      </td>
                      <td className="pr-6 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <div className="flex items-center">
                            <button
                              type="button"
                              className={`inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ${
                                previewRule === rule.id
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-white text-gray-900"
                              } ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
                              onClick={() => {
                                setHistoryRule(null);
                                setPreviewRule(prev => prev === rule.id ? null : rule.id);
                              }}
                            >
                              Preview
                            </button>
                          <button
                            type="button"
                            className={`inline-flex items-center px-3 py-2 text-sm font-semibold ml-1 rounded-md ${
                              historyRule === rule.id ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-900'
                            } ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
                            onClick={() => {
                              setPreviewRule(null);
                              setHistoryRule(prev => (prev === rule.id ? null : rule.id));
                            }}
                          >
                            History
                          </button>
                            <button
                              type="button"
                              className={`inline-flex items-center rounded-r-md border-l border-gray-300 px-2 py-2 ${
                                previewRule === rule.id
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-white text-gray-900"
                              } ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenu(
                                  openActionMenu === rule.id ? null : rule.id
                                );
                              }}
                            >
                              <ChevronDown
                                className={`h-4 w-4 transform transition-transform ${
                                  openActionMenu === rule.id ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                          {openActionMenu === rule.id && (
                            <div className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    onEdit(rule);
                                    setOpenActionMenu(null);
                                  }}
                                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    console.log(`Running rule: ${rule.id}`);
                                    setOpenActionMenu(null);
                                  }}
                                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Run
                                </button>
                                <button
                                  onClick={() => {
                                    onDelete(rule.id);
                                    setOpenActionMenu(null);
                                  }}
                                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        {previewRule && (
          <div className="w-1/3 border-l border-gray-200 p-6">
            <div className="space-y-6">
              {rules.find((r) => r.id === previewRule) && (
                <>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Rule Preview
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Preview of how this rule will be applied
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Conditions
                        </h4>
                        <div className="mt-2 text-sm text-gray-500">
                          {rules
                            .find((r) => r.id === previewRule)
                            ?.evaluation_spec.filters.map((filter, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <span>{filter.field}</span>
                                <span>{filter.operator}</span>
                                <span>{filter.value}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Action
                        </h4>
                        <p className="mt-2 text-sm text-gray-500">
                          {
                            rules.find((r) => r.id === previewRule)
                              ?.execution_spec.execution_type
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Schedule
                        </h4>
                        <p className="mt-2 text-sm text-gray-500">
                          Runs{" "}
                          {rules
                            .find((r) => r.id === previewRule)
                            ?.schedule_spec.schedule_type.toLowerCase()}
                          {rules.find((r) => r.id === previewRule)
                            ?.schedule_spec.time
                            ? ` at ${
                                rules.find((r) => r.id === previewRule)
                                  ?.schedule_spec.time
                              }`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {historyRule && (
          <div className="w-1/3 border-l border-gray-200 p-6 overflow-auto">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">History</h3>
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setHistoryRule(null)}
              >
                Close
              </button>
            </div>
            {historyLoading ? (
              <div>Loading history...</div>
            ) : historyError ? (
              <div className="text-red-500">Error: {historyError}</div>
            ) : historyData.length === 0 ? (
              <div>No history entries</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Timestamp</th>
                    <th className="px-4 py-2 text-left">Manual?</th>
                    <th className="px-4 py-2 text-left">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((entry, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {entry.timestamp
                          ? formatTimestamp(entry.timestamp)
                          : "-"}
                      </td>
                      <td className="px-4 py-2">
                        {typeof entry.is_manual === 'boolean'
                          ? (entry.is_manual ? 'Yes' : 'No')
                          : '-'}
                      </td>
                      <td className="px-4 py-2">
                        {Array.isArray(entry.results) && entry.results.length > 0
                          ? JSON.stringify(entry.results)
                          : 'No changes'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
