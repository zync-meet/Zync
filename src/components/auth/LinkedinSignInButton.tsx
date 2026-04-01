import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OAuthProvider, signInWithPopup, Auth } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface LinkedinSignInButtonProps {
  auth: Auth;
  disabled?: boolean;
}

export const LinkedinSignInButton = ({ auth, disabled }: LinkedinSignInButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLinkedinLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new OAuthProvider('oidc.linkedin');
      
      // Request standard OpenID Connect Scopes
      provider.addScope('openid');
      provider.addScope('profile');
      provider.addScope('email');

      await signInWithPopup(auth, provider);
      
      toast({
        title: "Success",
        description: "Logged in with LinkedIn successfully",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);
      
      if (error.code === 'auth/account-exists-with-different-credential') {
         toast({
          variant: "destructive",
          title: "Account Exists",
          description: "An account already exists with the same email. Please sign in with your original provider and link the accounts.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "LinkedIn Auth Error",
          description: error.message || "Failed to sign in with LinkedIn.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLinkedinLogin}
      disabled={isLoading || disabled}
      className="w-full flex items-center justify-center gap-2 hover:bg-[#EBF4F9] hover:text-[#0077B5] transition-colors hover:border-[#0077B5]"
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-[#0077B5] rounded-full animate-spin border-t-transparent" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#0077B5"
          className="w-5 h-5 mr-1"
        >
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      )}
      LinkedIn
    </Button>
  );
};
