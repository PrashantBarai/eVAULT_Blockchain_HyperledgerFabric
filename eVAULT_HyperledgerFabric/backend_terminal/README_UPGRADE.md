# Manual Chaincode Upgrades

The case acceptance bug was caused by a schema mismatch in `judge.go` where it strictly required a "Judgment" struct upon creation, which is typically null at first. I have fixed this in `backend_terminal/eVAULT_Contract/contracts/judge/judge.go` by marking it as optional.

I also added the `View` document button to `frontend/src/pages/judge/CaseReview.jsx` so judges can directly inspect documents!

## How to Apply the Fixes

Since you are running Microfab locally, please run these specific commands in your terminal to properly package and upgrade the **Judge** chaincode:

1. **Package the judge chaincode:**
   ```bash
   cd /home/luminalcore/TE_Code/eVAULT_HyperledgerFabric/backend_terminal
   export MICROFAB_CONFIG=$(cat MICROFAB.txt)
   source ./deploy_chaincode.sh package judge
   ```

2. **Global upgrade across required organizations:**
   ```bash
   source ./deploy_chaincode.sh global-upgrade judge
   ```
   *(Press `Enter` when it asks you to confirm installing on the BenchClerksOrg and JudgesOrg)*

After the script finishes, your Judge chaincode will be updated. You only need to reload the frontend webpage, and accepting the case will work perfectly!
