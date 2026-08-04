/**
 * 性能压测脚本 — 使用 autocannon 对本地生产服务器压测
 * 测试目标：
 *   1. 首页 SSR (/)
 *   2. 作品集页 (/works)
 *   3. 角色页 (/character)
 *   4. RSS API (/api/rss)
 *   5. 搜索 API (/api/search?q=test)
 *
 * 运行：node scripts/perf-test.mjs
 */
import autocannon from "autocannon";

const BASE_URL = "http://localhost:3000";
const DURATION = 15; // 秒

const testTargets = [
  { name: "首页 SSR (/)", url: "/", method: "GET" },
  { name: "作品集页 (/works)", url: "/works", method: "GET" },
  { name: "角色页 (/character)", url: "/character", method: "GET" },
  { name: "RSS API (/api/rss)", url: "/api/rss", method: "GET" },
  { name: "搜索 API (/api/search?q=test)", url: "/api/search?q=test", method: "GET" },
];

const concurrencyLevels = [10, 50, 100];

async function runTest(target, concurrency) {
  const result = await autocannon({
    url: BASE_URL + target.url,
    method: target.method,
    connections: concurrency,
    duration: DURATION,
    headers: {
      "Accept": "text/html,application/json",
    },
    timeout: 10,
  });

  return {
    target: target.name,
    url: target.url,
    concurrency,
    stats: {
      rps: result.requests.average,
      latencyAvg: result.latency.average,
      latencyP99: result.latency.p99,
      latencyMax: result.latency.max,
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx,
      totalRequests: result.requests.total,
      bytesPerSec: result.throughput.average,
    },
  };
}

async function main() {
  console.log("=".repeat(70));
  console.log("  性能压测报告 — daniya-fansite");
  console.log("  服务器: " + BASE_URL);
  console.log("  持续时间: " + DURATION + "s 每轮");
  console.log("=".repeat(70));

  const allResults = [];

  for (const target of testTargets) {
    console.log("\n" + "─".repeat(70));
    console.log("  目标: " + target.name);
    console.log("  URL: " + target.url);
    console.log("─".repeat(70));

    for (const concurrency of concurrencyLevels) {
      console.log(`\n  [并发 ${concurrency}] 开始压测...`);
      try {
        const result = await runTest(target, concurrency);
        allResults.push(result);

        console.log(`    吞吐量: ${result.stats.rps.toFixed(1)} req/s`);
        console.log(`    平均延迟: ${result.stats.latencyAvg} ms`);
        console.log(`    P99 延迟: ${result.stats.latencyP99} ms`);
        console.log(`    最大延迟: ${result.stats.latencyMax} ms`);
        console.log(`    错误数: ${result.stats.errors}`);
        console.log(`    超时数: ${result.stats.timeouts}`);
        console.log(`    非2xx: ${result.stats.non2xx}`);
        console.log(`    总请求: ${result.stats.totalRequests}`);
      } catch (err) {
        console.log(`    ✗ 测试失败: ${err.message}`);
        allResults.push({
          target: target.name,
          url: target.url,
          concurrency,
          error: err.message,
        });
      }
    }
  }

  // 输出汇总报告
  console.log("\n\n" + "=".repeat(70));
  console.log("  压测结果汇总");
  console.log("=".repeat(70));

  const grouped = {};
  for (const r of allResults) {
    if (!grouped[r.target]) grouped[r.target] = [];
    grouped[r.target].push(r);
  }

  for (const [target, results] of Object.entries(grouped)) {
    console.log("\n" + target);
    console.log("  并发  |  吞吐量    |  平均延迟  |  P99延迟   |  最大延迟  |  错误  |  超时");
    console.log("  " + "-".repeat(66));
    for (const r of results) {
      if (r.error) {
        console.log(`  ${String(r.concurrency).padStart(4)}  |  ERROR: ${r.error}`);
      } else {
        const s = r.stats;
        console.log(
          `  ${String(r.concurrency).padStart(4)}  |  ${s.rps.toFixed(1).padStart(8)} r/s  |  ${String(s.latencyAvg).padStart(7)} ms  |  ${String(s.latencyP99).padStart(7)} ms  |  ${String(s.latencyMax).padStart(7)} ms  |  ${String(s.errors).padStart(4)}  |  ${String(s.timeouts).padStart(4)}`
        );
      }
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("  压测完成");
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("压测脚本异常:", err);
  process.exit(1);
});
