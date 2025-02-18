import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Initial token parameters
const NAME: string = "Lumix Token";
const SYMBOL: string = "LMX";
const DECIMALS: number = 18;
const INITIAL_SUPPLY: number = 10000; // 10k
const CAP: number = 100000; // 100k
const FAUCET_AMOUNT: number = 10;

const LumixTokenModule = buildModule("LumixTokenModule", (m) => {
  const lumixToken = m.contract("LumixToken", [
    NAME,
    SYMBOL,
    DECIMALS,
    INITIAL_SUPPLY,
    CAP,
    FAUCET_AMOUNT,
  ]);

  return { lumixToken };
});

export default LumixTokenModule;
