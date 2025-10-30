/**
 * HR Service Configuration
 * Maps HR actions to their corresponding service endpoints
 */

const HR_SERVICE_BASE_URL = process.env.HR_SERVICE_URL || 'http://localhost:3001';

export const hrServiceConfig = {
  CreateEmployee: {
    url: `${HR_SERVICE_BASE_URL}/employees/create`,
    method: 'POST',
  },
  UpdateEmployee: {
    url: `${HR_SERVICE_BASE_URL}/employees/update`,
    method: 'POST',
  },
  DeleteEmployee: {
    url: `${HR_SERVICE_BASE_URL}/employees/delete`,
    method: 'POST',
  },
  GetEmployee: {
    url: `${HR_SERVICE_BASE_URL}/employees/get`,
    method: 'GET',
  },
};

export type HRAction = keyof typeof hrServiceConfig;
