<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>XML Sitemap | Pixel Isolate AI Background Remover</title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          :root {
            --bg: #030712;
            --card-bg: rgba(15, 23, 42, 0.8);
            --accent: #10b981;
            --text: #f3f4f6;
            --muted: #9ca3af;
            --border: rgba(255, 255, 255, 0.1);
          }
          body {
            margin: 0;
            padding: 2rem 1rem;
            background-color: var(--bg);
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
          }
          .header {
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 1.5rem;
          }
          h1 {
            font-size: 1.75rem;
            margin: 0 0 0.5rem 0;
            color: #ffffff;
          }
          p {
            color: var(--muted);
            font-size: 0.875rem;
            margin: 0;
            line-height: 1.5;
          }
          .badge {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--accent);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            margin-bottom: 0.75rem;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            overflow: hidden;
            font-size: 0.85rem;
          }
          th {
            background: rgba(255, 255, 255, 0.04);
            color: var(--muted);
            text-align: left;
            padding: 0.875rem 1rem;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            border-bottom: 1px solid var(--border);
          }
          td {
            padding: 0.875rem 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          tr:last-child td {
            border-bottom: none;
          }
          a {
            color: var(--accent);
            text-decoration: none;
            word-break: break-all;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
          }
          .footer {
            margin-top: 2.5rem;
            text-align: center;
            font-size: 0.85rem;
            color: var(--muted);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">XML Sitemap Directory</div>
            <h1>Pixel Isolate Indexing Structure</h1>
            <p>This is an interactive XML sitemap generated for search engine crawlers and web browsers. Below is the list of public indexable document URLs.</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Target URL Location</th>
                <th>Priority</th>
                <th>Frequency</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a>
                      <xsl:attribute name="href">
                        <xsl:value-of select="sitemap:loc"/>
                      </xsl:attribute>
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td><xsl:value-of select="sitemap:priority"/></td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td><xsl:value-of select="sitemap:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <div class="footer">
            <a href="https://pixelisolate.online/">← Return to Pixel Isolate Home</a>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
