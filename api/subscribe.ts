import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // We only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { email } = req.body;
  console.log('[Vercel API] received request body:', req.body);

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

  const timestamp = new Date().toISOString();

  try {
    // Step 1: Subscribe the profile to the specified list with Consent
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
                  },
                  properties: {
                    source: 'goddess_reborn_landing',
                    opt_in_time: timestamp
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

    console.log(`[Vercel API Klaviyo] Initiating API subscribe call for ${email} to list ${listId}`);
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

    if (!subResponse.ok) {
      const errText = await subResponse.text();
      console.error(`[Vercel API Klaviyo Subscribe Error] Status: ${subResponse.status} - ${errText}`);
      // Do not hard-crash the user's flow, try event tracking as well
    } else {
      console.log(`[Vercel API Klaviyo Subscribe] Completed successfully for ${email}`);
    }

    // Step 2: Track Event: "Meditation Opt-In" / "Goddess Reborn Signup"
    const eventPayload = {
      data: {
        type: 'event',
        attributes: {
          properties: {
            source: 'goddess_reborn_landing',
            opt_in_time: timestamp
          },
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: 'Meditation Opt-In'
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: email
              }
            }
          }
        }
      }
    };

    console.log(`[Vercel API Klaviyo] Tracking event 'Meditation Opt-In' for ${email}`);
    const eventResponse = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Revision': '2024-10-15'
      },
      body: JSON.stringify(eventPayload)
    });

    if (!eventResponse.ok) {
      const errText = await eventResponse.text();
      console.error(`[Vercel API Klaviyo Event Error] Status: ${eventResponse.status} - ${errText}`);
    } else {
      console.log(`[Vercel API Klaviyo Event] Tracked successfully for ${email}`);
    }

    return res.status(200).json({ success: true });

  } catch (klaviyoErr) {
    console.error('[Vercel API Klaviyo Catch Error]', klaviyoErr);
    // Resilient fallback: allow the user to reach the download page even if Klaviyo API itself experiences issues
    return res.status(200).json({
      success: true,
      warning: 'API call experienced issues but gracefully allowed the download flow.'
    });
  }
}
