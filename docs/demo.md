# Demo Walk-Through

This walk-through matches the intended 2-minute demo flow and highlights the privacy guarantees provided by Zama FHEVM.

## Demo Steps

1. Claim test USDT from the faucet or mint locally in the mock environment.
2. Wrap USDT into confidential cUSDT using the Token Manager.
3. Create a fund with a recipient and duration.
4. Encrypt a donation amount client-side and submit the donation.
5. Load the fund in the admin panel and request a reveal.
6. Submit the aggregated total and confirm that only the total is revealed.
7. Withdraw funds to the recipient after the reveal is complete.

## Expected Outcomes

- The donation amount is never visible on-chain.
- The fund records a donation count and encrypted total only.
- The reveal step shows the aggregated total, not individual amounts.

For a narrated version, see `docs/video.md` and `video/VIDEO_SCRIPT.md`.

