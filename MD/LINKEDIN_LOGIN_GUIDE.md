# Adding LinkedIn Login to Zync

Your request mentioned *Next.js 14/15* and *NextAuth.js v5*, but Zync is currently built using **React (Vite), Express.js**, and **Firebase Auth**. 
I have updated your current architecture to support LinkedIn authentication directly using Firebase.

## 1. Firebase (Current Architecture) Configuration

### Firebase Console Setup
Firebase supports LinkedIn login using **OpenID Connect (OIDC)**. Since LinkedIn now natively supports OIDC, this is a smooth process.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Authentication** > **Sign-in method**.
3. Click **Add new provider** > **OpenID Connect**.
4. Configure as follows:
   - **Name**: `LinkedIn`
   - **Provider ID**: `oidc.linkedin` (This matches our code `new OAuthProvider('oidc.linkedin')`).
   - **Client ID**: `869ub9zqulapww` *(from your prompt)*
   - **Issuer**: `https://www.linkedin.com` or `https://www.linkedin.com/oauth`
   - **Client Secret**: `<YOUR_LINKEDIN_CLIENT_SECRET>` *(from your prompt)*
5. Save the configuration.

### LinkedIn Developer Portal Setup
In the [LinkedIn Developer Portal](https://www.linkedin.com/developers/):
1. **Enable** "Sign In with LinkedIn using OpenID Connect" in your app's products.
2. Under **Auth** > **OAuth 2.0 settings**, add the **Firebase Redirect URI**:
   - `https://<YOUR_FIREBASE_PROJECT_ID>.firebaseapp.com/__/auth/handler`

---

## 2. Using NextAuth.js v5 (If rewriting frontend to Next.js)

If you are planning to migrate Zync away from the Vite SPA architecture to Next.js 14/15, here is exactly how you would set up the environment and `auth.ts` logic you requested.

### Environment Config (`.env.local`)
```env
AUTH_LINKEDIN_ID="869ub9zqulapww"
AUTH_LINKEDIN_SECRET="<YOUR_LINKEDIN_CLIENT_SECRET>"
AUTH_SECRET="your-generated-secret"

# Important for local testing and Vercel:
NEXTAUTH_URL="http://localhost:3000"
# (Vercel sets its own NEXTAUTH_URL automatically in production)
```

In the LinkedIn Portal, you'd add these Redirect URIs:
- Development: `http://localhost:3000/api/auth/callback/linkedin`
- Production: `https://zync-meet.vercel.app/api/auth/callback/linkedin`

### Auth Configuration (`auth.ts` or `src/auth.ts`)
```typescript
import NextAuth from "next-auth"
import LinkedIn from "next-auth/providers/linkedin"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID,
      clientSecret: process.env.AUTH_LINKEDIN_SECRET,
      issuer: "https://www.linkedin.com/oauth",
      authorization: {
        params: { scope: "openid profile email" },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ]
})
```

### Protected Dashboard Route (`src/app/dashboard/page.tsx`)
```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <div>Welcome to Zync Dashboard, {session.user?.name}</div>;
}
```

### Navbar Profile Picture (`src/components/Navbar.tsx`)
```tsx
import { auth } from "@/auth";
import Image from "next/image";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav>
      {session?.user?.image && (
        <Image 
          src={session.user.image} 
          alt="Profile" 
          width={40} 
          height={40} 
          className="rounded-full" 
        />
      )}
    </nav>
  )
}
```
