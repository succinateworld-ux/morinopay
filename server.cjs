
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
const RPC_URL = "https://testnet-rpc.monad.xyz";
const EXPLORER_URL = "https://testnet.monadexplorer.com";

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "dist")));
async function rpc(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params
    }),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`Monad RPC HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "RPC error");
  return data.result;
}

function mon(value) {
  if (!value) return "0";
  return (Number(BigInt(value)) / 1e18).toFixed(6);
}

app.get("/api/health", async (req, res) => {
  try {
    const [chainId, block] = await Promise.all([
      rpc("eth_chainId"),
      rpc("eth_blockNumber")
    ]);

    if (Number(BigInt(chainId)) !== 10143) {
      return res.status(502).json({
        ok: false,
        error: `Unexpected chain ID: ${chainId}`
      });
    }

    res.json({
      ok: true,
      network: "Monad Testnet",
      chainId: 10143,
      latestBlock: Number(BigInt(block))
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message
    });
  }
});

app.post("/api/analyze", async (req, res) => {
  const hash = String(req.body?.hash || "").trim();

  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    return res.status(400).json({
      error: "Enter a valid transaction hash starting with 0x."
    });
  }

  try {
    const [tx, receipt] = await Promise.all([
      rpc("eth_getTransactionByHash", [hash]),
      rpc("eth_getTransactionReceipt", [hash])
    ]);

    if (!tx) {
      return res.status(404).json({
        error: "Transaction not found on Monad Testnet."
      });
    }

    const risks = [];
    const notes = [];

    const status = !receipt
      ? "Pending or not yet confirmed"
      : receipt.status === "0x1"
        ? "Successful"
        : "Failed";

    if (receipt && receipt.status !== "0x1") {
      risks.push({
        level: "high",
        title: "Execution failed",
        detail: "The transaction receipt reports failure. Review the reason before retrying."
      });
    }

    if (!receipt) {
      notes.push("No receipt is available yet, so the final execution outcome is unconfirmed.");
    }

    if (!tx.to) {
      notes.push("This transaction appears to create a contract.");
    } else {
      try {
        const code = await rpc("eth_getCode", [tx.to, "latest"]);
        notes.push(
          code && code !== "0x" && code !== "0x0"
            ? "The recipient has contract bytecode. This is not a security audit."
            : "No contract bytecode was returned for the recipient at the latest block. This does not establish trustworthiness."
        );
      } catch {
        notes.push("The recipient code check was unavailable.");
      }
    }

    if (BigInt(tx.value || "0") > 0n) {
      notes.push(`Native token value transferred: ${mon(tx.value)} MON. A transfer alone is not evidence of fraud.`);
    }

    if (!risks.length) {
      risks.push({
        level: "info",
        title: "No execution failure detected",
        detail: "This basic check does not establish that the transaction or recipient is safe."
      });
    }

    res.json({
      hash,
      network: "Monad Testnet",
      status,
      from: tx.from,
      to: tx.to || null,
      valueMON: mon(tx.value),
      blockNumber: receipt
        ? Number(BigInt(receipt.blockNumber))
        : tx.blockNumber
          ? Number(BigInt(tx.blockNumber))
          : null,
      gasUsed: receipt?.gasUsed
        ? BigInt(receipt.gasUsed).toString()
        : null,
      explorerUrl: `${EXPLORER_URL}/tx/${hash}`,
      risks,
      notes,
      disclaimer: "Basic transaction indicators only; not a security audit or a guarantee of safety."
    });
  } catch (error) {
    console.error("Transaction analysis error:", error.message);
    res.status(502).json({
      error: "Monad Testnet could not provide the transaction data. Please try again."
    });
  }
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Morinopay server running on port ${PORT}`);
});
