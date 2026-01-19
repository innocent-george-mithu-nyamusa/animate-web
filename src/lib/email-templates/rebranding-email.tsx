import React from 'react';

interface RebrandingEmailProps {
  userName?: string;
}

export const RebrandingEmail: React.FC<RebrandingEmailProps> = ({
  userName = 'Valued Customer',
}) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>We're Now IconicMe!</title>
      </head>
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          lineHeight: '1.6',
          color: '#333',
          backgroundColor: '#f4f4f4',
          margin: 0,
          padding: 0,
        }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{ backgroundColor: '#f4f4f4', padding: '20px 0' }}
        >
          <tr>
            <td align="center">
              <table
                width="600"
                cellPadding="0"
                cellSpacing="0"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {/* Header with gradient */}
                <tr>
                  <td
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                      padding: '40px 30px',
                      textAlign: 'center',
                    }}
                  >
                    <h1
                      style={{
                        color: '#ffffff',
                        fontSize: '32px',
                        margin: '0 0 10px 0',
                        fontWeight: 'bold',
                      }}
                    >
                      🎉 Exciting News!
                    </h1>
                    <p
                      style={{
                        color: '#ffffff',
                        fontSize: '18px',
                        margin: 0,
                        opacity: 0.9,
                      }}
                    >
                      We have a new name and home
                    </p>
                  </td>
                </tr>

                {/* Main Content */}
                <tr>
                  <td style={{ padding: '40px 30px' }}>
                    <p
                      style={{
                        fontSize: '16px',
                        marginBottom: '20px',
                        color: '#333',
                      }}
                    >
                      Dear {userName},
                    </p>

                    <p
                      style={{
                        fontSize: '16px',
                        marginBottom: '20px',
                        color: '#555',
                      }}
                    >
                      We're thrilled to share some exciting news with you! <strong>Animate</strong> is
                      now <strong style={{ color: '#7c3aed' }}>IconicMe</strong>! 🎨✨
                    </p>

                    <div
                      style={{
                        backgroundColor: '#f9fafb',
                        padding: '20px',
                        borderRadius: '8px',
                        borderLeft: '4px solid #7c3aed',
                        marginBottom: '20px',
                      }}
                    >
                      <h2
                        style={{
                          fontSize: '20px',
                          marginTop: 0,
                          marginBottom: '15px',
                          color: '#7c3aed',
                        }}
                      >
                        What's Changed?
                      </h2>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '10px' }}>
                          <strong>New Name:</strong> Animate → <strong>IconicMe</strong>
                        </li>
                        <li style={{ marginBottom: '10px' }}>
                          <strong>New Website:</strong>{' '}
                          <a
                            href="https://iconicme.shop"
                            style={{ color: '#7c3aed', textDecoration: 'none' }}
                          >
                            https://iconicme.shop
                          </a>
                        </li>
                        <li style={{ marginBottom: '10px' }}>
                          <strong>New Email:</strong> no-reply@iconicme.shop
                        </li>
                      </ul>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#ecfdf5',
                        padding: '20px',
                        borderRadius: '8px',
                        borderLeft: '4px solid #10b981',
                        marginBottom: '20px',
                      }}
                    >
                      <h2
                        style={{
                          fontSize: '20px',
                          marginTop: 0,
                          marginBottom: '15px',
                          color: '#059669',
                        }}
                      >
                        What Stays the Same?
                      </h2>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '10px' }}>
                          ✅ Your account and subscription details
                        </li>
                        <li style={{ marginBottom: '10px' }}>
                          ✅ All 10 amazing AI toy styles you love
                        </li>
                        <li style={{ marginBottom: '10px' }}>
                          ✅ Your generation credits and history
                        </li>
                        <li style={{ marginBottom: '10px' }}>
                          ✅ Same great service and support
                        </li>
                        <li>✅ Payment methods (Ecocash, OneMoney, Cards)</li>
                      </ul>
                    </div>

                    <p
                      style={{
                        fontSize: '16px',
                        marginBottom: '20px',
                        color: '#555',
                      }}
                    >
                      This rebrand reflects our commitment to making your photos truly iconic!
                      We've also improved our platform with faster processing, better AI models, and
                      an enhanced user experience.
                    </p>

                    <div style={{ textAlign: 'center', margin: '30px 0' }}>
                      <a
                        href="https://iconicme.shop"
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#7c3aed',
                          color: '#ffffff',
                          padding: '14px 30px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '16px',
                          fontWeight: 'bold',
                        }}
                      >
                        Visit IconicMe.shop Now →
                      </a>
                    </div>

                    <p
                      style={{
                        fontSize: '14px',
                        color: '#666',
                        fontStyle: 'italic',
                        marginTop: '30px',
                      }}
                    >
                      <strong>Important:</strong> Please update your bookmarks to{' '}
                      <a
                        href="https://iconicme.shop"
                        style={{ color: '#7c3aed', textDecoration: 'none' }}
                      >
                        iconicme.shop
                      </a>
                      . The old domain will redirect for a limited time.
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      backgroundColor: '#f9fafb',
                      padding: '30px',
                      textAlign: 'center',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '16px',
                        marginBottom: '15px',
                        color: '#333',
                      }}
                    >
                      Thank you for being part of our journey! 💜
                    </p>
                    <p
                      style={{
                        fontSize: '14px',
                        color: '#666',
                        margin: '10px 0',
                      }}
                    >
                      <strong>IconicMe Team</strong>
                      <br />
                      Pixelspulse Private Limited
                    </p>
                    <div style={{ marginTop: '20px' }}>
                      <a
                        href="https://iconicme.shop"
                        style={{
                          color: '#7c3aed',
                          textDecoration: 'none',
                          fontSize: '14px',
                          marginRight: '15px',
                        }}
                      >
                        Website
                      </a>
                      <a
                        href="https://iconicme.shop/privacy-policy"
                        style={{
                          color: '#7c3aed',
                          textDecoration: 'none',
                          fontSize: '14px',
                          marginRight: '15px',
                        }}
                      >
                        Privacy Policy
                      </a>
                      <a
                        href="mailto:consult@pixels.co.zw"
                        style={{
                          color: '#7c3aed',
                          textDecoration: 'none',
                          fontSize: '14px',
                        }}
                      >
                        Contact Us
                      </a>
                    </div>
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#999',
                        marginTop: '20px',
                      }}
                    >
                      © 2024 Pixelspulse Private Limited. All rights reserved.
                      <br />
                      Made with ❤️ in Zimbabwe
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

// Plain text version for email clients that don't support HTML
export const rebrandingEmailPlainText = (userName: string = 'Valued Customer') => `
Dear ${userName},

EXCITING NEWS: ANIMATE IS NOW ICONICME! 🎉

We're thrilled to share that Animate has rebranded to IconicMe!

WHAT'S CHANGED?
- New Name: Animate → IconicMe
- New Website: https://iconicme.shop
- New Email: enquiry@iconicme.shop

WHAT STAYS THE SAME?
✅ Your account and subscription details
✅ All 10 amazing AI toy styles you love
✅ Your generation credits and history
✅ Same great service and support
✅ Payment methods (Ecocash, OneMoney, Cards)

This rebrand reflects our commitment to making your photos truly iconic!

IMPORTANT: Please update your bookmarks to iconicme.shop. The old domain will redirect for a limited time.

Visit us now: https://iconicme.shop

Thank you for being part of our journey! 💜

Best regards,
The IconicMe Team
Pixelspulse Private Limited

Website: https://iconicme.shop
Email: consult@pixels.co.zw

© 2024 Pixelspulse Private Limited. All rights reserved.
Made with ❤️ in Zimbabwe
`;
