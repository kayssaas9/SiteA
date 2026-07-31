import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ReferralLanding() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem("astraReferralCode", code.trim());
    }
    navigate("/", { replace: true });
  }, [code, navigate]);

  return null;
}
