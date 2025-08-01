import { ChromeUser } from '@redhat-cloud-services/types';

const CHECK_URL = '/hydra/rest/contacts/sso/current';

type CheckARHAuthResponse = {
  isEntitled: boolean;
  isInternal: boolean;
};

function isCheckARHAuthResponse(data: unknown): data is CheckARHAuthResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'isEntitled' in data &&
    typeof data.isEntitled === 'boolean' &&
    'isInternal' in data &&
    typeof data.isInternal === 'boolean'
  );
}

async function checkARHAuth(baseUrl: string, user: ChromeUser, token: string): Promise<boolean> {
  const url = new URL(baseUrl);
  url.pathname = CHECK_URL;
  const params = new URLSearchParams();
  params.set('userId', user.identity.internal?.account_id || '');
  params.set('assumeEntitledIfSubscriptionServiceUnavailable', 'true');
  params.set('redhat_client', 'cloud-services');
  params.set('account_number', user.identity.account_number || '');
  url.search = params.toString();
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    if (isCheckARHAuthResponse(data)) {
      return data.isEntitled || data.isInternal;
    }
    return false;
  } catch (error) {
    console.error('Error checking ARH authentication:', error);
    return false;
  }
}

export default checkARHAuth;
