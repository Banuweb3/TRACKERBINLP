/**
 * Safe access utilities to prevent "cannot access property of undefined" errors
 * This is especially important for production deployments where API responses may differ
 */

// Safe property access with default fallback
export const safeGet = <T>(obj: any, path: string, defaultValue: T): T => {
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  } catch (error) {
    console.warn(`Safe access failed for path: ${path}`, error);
    return defaultValue;
  }
};

// Safe array access
export const safeArray = <T>(arr: any, defaultValue: T[] = []): T[] => {
  return Array.isArray(arr) ? arr : defaultValue;
};

// Safe object access
export const safeObject = <T>(obj: any, defaultValue: T = {} as T): T => {
  return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : defaultValue;
};

// Safe string access
export const safeString = (str: any, defaultValue: string = ''): string => {
  return typeof str === 'string' ? str : defaultValue;
};

// Safe number access
export const safeNumber = (num: any, defaultValue: number = 0): number => {
  const parsed = Number(num);
  return !isNaN(parsed) ? parsed : defaultValue;
};

// Guard function for checking if object has required properties
export const hasRequiredProps = (obj: any, props: string[]): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  
  return props.every(prop => {
    const keys = prop.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }
    
    return true;
  });
};

// Safe API response handler
export const safeApiResponse = <T>(response: any, validator?: (data: any) => boolean): T | null => {
  try {
    if (!response) {
      console.warn('API response is null or undefined');
      return null;
    }
    
    if (validator && !validator(response)) {
      console.warn('API response failed validation');
      return null;
    }
    
    return response as T;
  } catch (error) {
    console.error('Safe API response error:', error);
    return null;
  }
};

// Session validation specifically for your BPO app
export const validateSession = (session: any): boolean => {
  return hasRequiredProps(session, ['id', 'sessionName']);
};

// Agent validation
export const validateAgent = (agent: any): boolean => {
  return hasRequiredProps(agent, ['id', 'name']);
};

// Lead validation  
export const validateLead = (lead: any): boolean => {
  return hasRequiredProps(lead, ['id', 'name']);
};
