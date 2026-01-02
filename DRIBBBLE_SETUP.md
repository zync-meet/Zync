# Dribbble API Setup Guide

Follow these steps to register your application with Dribbble and configure it for local development.

## 1. Register a New Application

1.  Log in to your [Dribbble](https://dribbble.com) account.
2.  Go to **Account Settings** > **Applications** (or visit [https://dribbble.com/account/applications/new](https://dribbble.com/account/applications/new)).
3.  Fill in the form with the following details:

| Field | Value | Explanation |
| :--- | :--- | :--- |
| **Name** | `Zync (Dev)` | The name of your app as it will appear to users. |
| **Description** | `A project management and collaboration tool.` | A brief description of what your app does. |
| **Website URL** | `http://localhost:5173` | The URL where your frontend is running (Vite default). |
| **Callback URL** | `http://localhost:5173` | Required for OAuth. Since we are using a Client Access Token for now, you can just set this to your homepage. |

4.  Agree to the terms and click **Register application**.

## 2. Get Your API Keys

Once registered, you will see your application details.

1.  Locate the **Client Access Token** section.
2.  Copy the **Client Access Token**. This is the only key we currently need for the `DesignView` search feature.
    *   *Note: If you plan to implement full user login with Dribbble later, you will also need the `Client ID` and `Client Secret`.*

## 3. Configure Your Backend

1.  Open the file `backend/.env` in your project.
2.  Add your token as shown below:

```env
DRIBBBLE_ACCESS_TOKEN=your_copied_access_token_here
```

3.  **Restart your backend server** for the changes to take effect.

## Important Notes

*   **Rate Limits**: The Dribbble API has rate limits. If you see 429 errors, you are making too many requests.
*   **Security**: Never commit your `.env` file to GitHub. It is already in your `.gitignore`, which is good.
