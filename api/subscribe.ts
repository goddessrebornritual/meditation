import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // We only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { email } = req.body;
  console.log('received request body:', req.body);

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  const apiKey = process.env.KLAVIYO_API_KEY;
  if (!apiKey || apiKey === 'your_klaviyo_api_key_here' || apiKey.startsWith('MY_')) {
    console.warn('KLAVIYO_API_KEY is not configured or is a placeholder/sandbox key. Simulating success in Sandbox mode.');
    return res.status(200).json({ success: true, sandbox: true, message: 'Saved to sandbox list successfully.' });
  }

  // Minimum valid payload required by Klaviyo profiles endpoint
  const payload = {
    data: {
      type: 'profile',
      attributes: {
        email: email
      }
    }
  };

  console.log('payload sent to Klaviyo:', JSON.stringify(payload));

  try {
    const response = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/json',
        'Revision': '2024-10-15'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log(`Klaviyo profile response status: ${response.status}`, responseText);

    if (!response.ok) {
      console.error('Klaviyo profile response or error:', responseText);
      return res.status(response.status).json({ success: false, error: `Klaviyo profile error: ${responseText}` });
    }

    let profileId: string | undefined;
    try {
      const responseJson = JSON.parse(responseText);
      profileId = responseJson.data?.id;
    } catch (parseError) {
      console.error('Failed to parse Klaviyo profile response JSON:', parseError);
    }

    if (!profileId) {
      console.error('Klaviyo profile successfully created but profile ID was not found in response:', responseText);
      return res.status(500).json({ success: false, error: 'Klaviyo profile ID not found in response.' });
    }

    const listId = process.env.KLAVIYO_LIST_ID;
    if (!listId || listId === 'your_klaviyo_list_id_here' || listId.startsWith('MY_')) {
      console.warn('KLAVIYO_LIST_ID is not configured or is a placeholder/sandbox key. Profile was created successfully but list subscription skipped.');
      return res.status(200).json({ success: true, sandbox: true, message: 'Profile created, list subscription skipped in Sandbox mode.' });
    }

    console.log(`Adding profile ID ${profileId} to list ID ${listId}`);

    const listPayload = {
      data: [
        {
          type: 'profile',
          id: profileId
        }
      ]
    };

    const listResponse = await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/json',
        'Revision': '2024-10-15'
      },
      body: JSON.stringify(listPayload)
    });

    const listResponseText = await listResponse.text();
    console.log(`Klaviyo list subscription response status: ${listResponse.status}`, listResponseText);

    if (!listResponse.ok) {
      console.error('Klaviyo list subscription response or error:', listResponseText);
      return res.status(listResponse.status).json({ success: false, error: `Klaviyo list subscription error: ${listResponseText}` });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Klaviyo error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
