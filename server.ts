import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { promises as fsPromises } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Startup Logging
  console.log('--------------------------------------------------');
  console.log('GODDESS REBORN LANDING FUNNEL STARTING UP');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Mode: ${isProd ? 'Production' : 'Development'}`);
  console.log('Checking Environment Variables:');
  console.log(`- KLAVIYO_API_KEY: ${process.env.KLAVIYO_API_KEY ? 'CONFIGURED' : 'MISSING (Will run in Sandbox/Mock mode)'}`);
  console.log(`- KLAVIYO_LIST_ID: ${process.env.KLAVIYO_LIST_ID ? 'CONFIGURED' : 'MISSING (Will run in Sandbox/Mock mode)'}`);
  console.log('--------------------------------------------------');

  // API endpoint for subscription
  app.post('/api/subscribe', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      }

      console.log(`[API] Subscription trigger received for: ${email}`);

      const apiKey = process.env.KLAVIYO_API_KEY;
      const listId = process.env.KLAVIYO_LIST_ID;

      // Handle fallback if keys are missing/placeholders
      if (!apiKey || !listId || apiKey === 'your_klaviyo_api_key_here' || listId === 'your_klaviyo_list_id_here' || apiKey.startsWith('MY_')) {
        console.warn(`[Klaviyo Sandbox] Credentials missing or generic. Simulating successful sign-up in Sandbox mode.`);
        return res.json({
          success: true,
          sandbox: true,
          message: 'Saved to local sandbox list successfully.'
        });
      }

      const timestamp = new Date().toISOString();

      try {
        // Step 1: Subscribe the profile to the specified list
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

        console.log(`[Klaviyo] Initiating API subscribe call for ${email} to list ${listId}`);
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
          console.error(`[Klaviyo Subscribe Response Error] Status: ${subResponse.status} - ${errText}`);
          // Do not crash, proceed to try event tracking or return a graceful recovery
        } else {
          console.log(`[Klaviyo Subscribe] Completed successfully for ${email}`);
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

        console.log(`[Klaviyo] Tracking event 'Meditation Opt-In' for ${email}`);
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
          console.error(`[Klaviyo Event Response Error] Status: ${eventResponse.status} - ${errText}`);
        } else {
          console.log(`[Klaviyo Event] Tracked successfully for ${email}`);
        }

        return res.json({ success: true });

      } catch (klaviyoErr) {
        console.error('[Klaviyo API Catch Error]', klaviyoErr);
        // Resilient fallback: allow the user to reach the download page even if Klaviyo API itself times out or has a network blocker
        return res.json({
          success: true,
          warning: 'API call experienced issues but gracefully allowed the download flow.'
        });
      }

    } catch (serverErr) {
      console.error('[Express Subscribe Fatal Error]', serverErr);
      return res.status(500).json({ success: false, error: 'Internal server error. Please try again.' });
    }
  });

  // Serve static assets based on environment
  if (isProd) {
    const distPath = path.resolve(__dirname); // server.cjs is IN the dist folder
    console.log(`[Server] Production mode: serving static files from ${distPath}`);
    app.use(express.static(distPath));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[Server] Development mode: initializing Vite middleware...');
    const { createServer: createViteServer } = await import('vite');
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(viteInstance.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      try {
        const url = req.originalUrl;
        const htmlFile = path.resolve(process.cwd(), 'index.html');
        let html = await fsPromises.readFile(htmlFile, 'utf-8');
        html = await viteInstance.transformIndexHtml(url, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e: any) {
        viteInstance.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================`);
    console.log(`Goddess Reborn Server listening on http://0.0.0.0:${PORT}`);
    console.log(`==================================================`);
  });
}

startServer().catch((fatalErr) => {
  console.error('[Fatal Starter Error]', fatalErr);
});
