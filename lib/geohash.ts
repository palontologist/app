const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export function encodeGeohash(lat: number, lon: number, precision = 5): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";
  // Clamp to valid ranges
  lat = Math.max(-90, Math.min(90, lat));
  lon = Math.max(-180, Math.min(180, lon));

  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  let hash = "";
  let bits = 0;
  let ch = 0;
  let even = true;

  while (hash.length < precision) {
    if (even) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) {
        ch = (ch << 1) | 1;
        lonMin = mid;
      } else {
        ch = (ch << 1) | 0;
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch = (ch << 1) | 1;
        latMin = mid;
      } else {
        ch = (ch << 1) | 0;
        latMax = mid;
      }
    }

    even = !even;
    bits++;

    if (bits === 5) {
      hash += BASE32[ch];
      bits = 0;
      ch = 0;
    }
  }

  return hash;
}

