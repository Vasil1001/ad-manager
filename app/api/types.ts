export interface AdRule {
  id?: string;
  name: string;
  evaluation_spec: {
    evaluation_type: string;
    filters: Array<{
      field: string;
      operator: string;
      value: string | number;
    }>;
  };
  execution_spec: {
    execution_type: string;
    id?: string;
    execution_options?: Array<{
      field: string;
      value: string[] | object;
      operator: string;
    }>;
  };
  schedule_spec: {
    schedule_type: string;
    time?: string;
  };
  notifications?: {
    onFacebook: boolean;
  };
  subscribers?: string[];
  status?: string;
  created_time?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}
