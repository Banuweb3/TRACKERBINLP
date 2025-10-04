/**
 * Production Safety Utilities
 * Fixes the "TypeError: can't access property 'id', H is undefined" error in production
 */

// Safe property access that prevents undefined errors
export const safeProp = <T>(obj: any, prop: string, fallback: T): T => {
  try {
    return obj && obj[prop] !== undefined ? obj[prop] : fallback;
  } catch {
    return fallback;
  }
};

// Safe nested property access
export const safeNested = <T>(obj: any, path: string, fallback: T): T => {
  try {
    if (!obj) return fallback;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (!current || current[key] === undefined) {
        return fallback;
      }
      current = current[key];
    }
    
    return current;
  } catch {
    return fallback;
  }
};

// Guard for API responses - prevents the H.id error
export const guardApiResponse = (response: any): any => {
  if (!response) {
    console.warn('🛡️ Production Safety: Null API response detected');
    return {};
  }
  
  if (Array.isArray(response)) {
    return response.filter(item => item && typeof item === 'object');
  }
  
  if (typeof response === 'object') {
    return response;
  }
  
  console.warn('🛡️ Production Safety: Invalid API response type:', typeof response);
  return {};
};

// Safe array mapping that handles undefined items
export const safeMap = <T, R>(array: any, mapper: (item: T, index: number) => R, fallback: R[] = []): R[] => {
  try {
    if (!Array.isArray(array)) {
      console.warn('🛡️ Production Safety: Expected array but got:', typeof array);
      return fallback;
    }
    
    return array
      .filter(item => item !== null && item !== undefined)
      .map(mapper);
  } catch (error) {
    console.error('🛡️ Production Safety: Safe map error:', error);
    return fallback;
  }
};

// Session validator for BPO app
export const isValidSession = (session: any): boolean => {
  return !!(
    session &&
    typeof session === 'object' &&
    session.id &&
    session.sessionName
  );
};

// Agent validator
export const isValidAgent = (agent: any): boolean => {
  return !!(
    agent &&
    typeof agent === 'object' &&
    agent.id &&
    agent.name
  );
};

// Lead validator
export const isValidLead = (lead: any): boolean => {
  return !!(
    lead &&
    typeof lead === 'object' &&
    lead.id &&
    lead.name
  );
};

// Production-safe component wrapper
export const withProductionSafety = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      console.error('🛡️ Production Safety: Component error caught:', error);
      return React.createElement('div', {
        className: 'p-4 bg-red-50 border border-red-200 rounded-lg'
      }, 'Component temporarily unavailable');
    }
  };
};
