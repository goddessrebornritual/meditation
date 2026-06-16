import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { email } = req.body;
  console.log('[Vercel API] Received subscription request for:', email);

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  const apiKey = process.env.KLAVIYO_API_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  // Handle fallback if keys are missing or placeholders (Sandbox Mode)
  if (!apiKey || !listId || apiKey === 'your_klaviyo_api_key_here' || listId === 'your_klaviyo_list_id_here' || apiKey.startsWith('MY_')) {
    console.warn('[Vercel API Sandbox] Credentials missing or generic. Simulating successful sign-up in Sandbox mode.');
    return res.status(200).json({
      success: true,
      sandbox: true,
      message: 'Saved to local sandbox list successfully.'
    });
  }

  try {
    // Construct the payload according to Klaviyo Profile/List SDK/API specification.
    // Invalid internal custom 'properties' block is removed to avoid API error:
    // "'properties' is not a valid field for the resource 'profile'"
    const subscribePayload = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'goddess_reborn_landing',
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: email,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED'
                      }
                    }
                  }
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: listId
            }
          }
        }
      }
    };

    console.log(`[Vercel API Klaviyo] Initiating subscription call for ${email} to list ${listId}`);
    const subResponse = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Revision': '2024-10-15'
      },
      body: JSON.stringify(subscribePayload)
    });

    const responseText = await subResponse.text();
    console.log(`[Vercel API Klaviyo] Response Status: ${subResponse.status}`);

    if (!subResponse.ok) {
      console.error(`[Vercel API Klaviyo Subscribe Error] Status: ${subResponse.status} - ${responseText}`);
      return res.status(subResponse.status).json({
        success: false,
        error: `Klaviyo bulk subscription error: ${responseText}`
      });
    }

    console.log(`[Vercel API Klaviyo Subscribe] Successfully subscribed ${email}`);
    return res.status(200).json({ success: true });

  } catch (klaviyoErr) {
    console.error('[Vercel API Klaviyo Catch Error]', klaviyoErr);
    // Safe resilient fallback: allow the user to reach the download page even if Klaviyo API itself has unexpected issues
    return res.status(200).json({
      success: true,
      warning: 'API call experienced issues but gracefully allowed the download flow.'
    });
  }
}
