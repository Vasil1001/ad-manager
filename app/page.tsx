"use client";

import { useEffect, useState } from "react";
import RulesTable from "../components/RulesTable";
import RuleModal from "../components/RuleModal";
import { AdRule } from "./api/types";

interface ApiDataItem extends AdRule {
  id: string;
  created_time?: string;
  account_id?: string;
}

export default function Home() {
  const [data, setData] = useState<ApiDataItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ApiDataItem | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api");
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const result = await response.json();

      if (result && Array.isArray(result.data)) {
        setData(result.data);
      } else if (Array.isArray(result)) {
        setData(result);
      } else {
        console.error("Fetched data is not in the expected format:", result);
        setData([]);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreateRule = async (rule: AdRule) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      setModalOpen(false);
      await fetchRules(); // Refresh the rules list
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create rule");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRule = async (rule: AdRule & { id: string }) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handleUpdateRule = async (rule: AdRule) => {
    if (!editingRule) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/rule/${editingRule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      setModalOpen(false);
      setEditingRule(undefined);
      await fetchRules(); // Refresh the rules list
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update rule");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/rule/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      await fetchRules(); // Refresh the rules list
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete rule");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Automated Rules</h1>
        <p className="text-gray-600 mt-1">Manage your Facebook ad rules</p>
      </header>

      <div className="mb-6 flex justify-between items-center">
        <div>
          {isLoading && <span className="text-blue-600">Loading...</span>}
          {error && <span className="text-red-500">Error: {error}</span>}
        </div>
        <button
          onClick={() => {
            setEditingRule(undefined);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <span className="mr-2">+</span> Create Rule
        </button>
      </div>

      {data === null && !error ? (
        <div className="text-center py-10">Loading rules...</div>
      ) : (
        <RulesTable
          rules={data || []}
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
        />
      )}

      <RuleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRule(undefined);
        }}
        onSave={editingRule ? handleUpdateRule : handleCreateRule}
        initialData={editingRule}
      />
    </div>
  );
}
