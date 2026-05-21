function unwrap(o) {
  if (o === null || o === undefined) return '';
  if (typeof o === 'string') {
    var s = o.trim();
    if (s.charAt(0) === '{' && s.charAt(s.length - 1) === '}') {
      try {
        var parsed = JSON.parse(s);
        return unwrap(parsed);
      } catch (e) {
        if (s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') return s.substring(1, s.length - 1);
        return s;
      }
    }
    if (s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') return s.substring(1, s.length - 1);
    return s;
  }
  if (typeof o === 'object') {
    var keys = Object.keys(o);
    if (keys.length === 1) return unwrap(o[keys[0]]);
    try { return JSON.stringify(o); } catch (e) { return ''; }
  }
  return String(o);
}

var source = ($json && typeof $json === 'object' && $json.text !== undefined) ? $json.text : $json;
var cleaned = unwrap(source);
return { json: { text: cleaned } };
