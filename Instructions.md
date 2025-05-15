## 1. Project Goal

To create a basic Next.js Create, Read, Update, Delete (CRUD) application for 
managing Facebook Ads API rules. The primary focus is to implement a specific 
automated rule: "Check daily to pause ads where the ad name includes 'TEST' after it's spent $20."

This project will provide experience with:
* Interacting with the Facebook Ads API (specifically the Automated Rules API).
* Handling API requests and responses.
* Building a frontend UI with Next.js to manage these rules.
* Visualizing data related to ad rules.

## 2. Core Task: Scheduled Rule Implementation

The main rule to implement is:
* **Name:** e.g., "Daily Pause TEST Ads > $20 Spend"
* **Schedule:** Daily check.
* **Condition:**
    * Target ads whose name contains the string "TEST".
    * Trigger when an ad's spend exceeds $20.
* **Action:** Pause the ad.