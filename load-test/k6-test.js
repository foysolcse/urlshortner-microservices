import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://urlshortener.local";

export const options = {
  scenarios: {
    noon_spike: {
      executor: "ramping-vus",
      stages: [
        { duration: "1m", target: 10 },
        { duration: "2m", target: 75 },
        { duration: "3m", target: 150 },
        { duration: "2m", target: 25 },
        { duration: "1m", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1000"],
  },
};

export function setup() {
  const create = http.post(
    `${BASE_URL}/create`,
    { long_url: "https://example.com" },
    { redirects: 0 }
  );

  check(create, {
    "short URL created": (res) => res.status === 200,
  });

  const body = create.json();
  return {
    shortUrl: body.short_url || `${BASE_URL}/health`,
  };
}

export default function (data) {
  const dashboard = http.get(BASE_URL);
  check(dashboard, {
    "dashboard available": (res) => res.status === 200,
  });

  const stats = http.get(`${BASE_URL}/api/stats`);
  check(stats, {
    "stats available": (res) => res.status === 200,
  });

  const redirect = http.get(data.shortUrl, { redirects: 0 });
  check(redirect, {
    "redirect returns 301/302": (res) => [301, 302, 308].includes(res.status),
  });

  sleep(1);
}
