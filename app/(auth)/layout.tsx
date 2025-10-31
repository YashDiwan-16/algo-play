// 1:app/(auth)/layout.tsx
import Auth from "@/components/Auth";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <Auth>{children}</Auth>;
};

export default AuthLayout;
