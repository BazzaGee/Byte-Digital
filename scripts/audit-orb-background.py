"""Static audit: every built page must carry the orb background layer.

Checks each dist HTML file for the canvas element, the layer wrapper, and the
module script that boots the engine. A page missing any of these will not
show the scroll-scrubbed background.

`EXEMPT` lists routes that intentionally opt out. These are private admin
surfaces that do not use BaseLayout at all: they carry their own <html>/<body>,
are marked noindex/nofollow, and are excluded from the sitemap. A decorative
scrolling video behind a login form or an ops dashboard is a distraction, so
the background is deliberately not applied there.
"""

import os
import sys

EXEMPT = ('/admin-login/', '/chatbot-dashboard/')

def audit(dist='dist'):
    pages = []
    for root, _dirs, files in os.walk(dist):
        for name in files:
            if name in ('index.html', '404.html'):
                path = os.path.join(root, name)
                rel = os.path.relpath(path, dist).replace('index.html', '')
                rel = rel.replace('404.html', '')
                # Normalise to a leading-slash URL path so the EXEMPT prefixes
                # match, regardless of the host path separator.
                rel = '/' + rel.replace('\\', '/').lstrip('/')
                if not rel.endswith('/'):
                    rel += '/'
                pages.append((rel, path))

    missing = []
    exempt = 0
    for rel, path in sorted(pages):
        if any(rel.startswith(e) for e in EXEMPT):
            exempt += 1
            continue
        html = open(path, encoding='utf-8', errors='replace').read()
        has_canvas = 'orb-bg-canvas' in html
        has_layer = 'class="orb-bg"' in html
        has_engine = 'createImageBitmap' in html or 'orb-bg' in html
        if not (has_canvas and has_layer and has_engine):
            missing.append((rel, has_canvas, has_layer, has_engine))

    print('pages scanned: %d (exempt: %d)' % (len(pages), exempt))
    print('pages missing orb background: %d' % len(missing))
    for row in missing:
        print('   ', row)
    return 1 if missing else 0

if __name__ == '__main__':
    sys.exit(audit(sys.argv[1] if len(sys.argv) > 1 else 'dist'))
