import { useEffect, useState } from "react";
import {
  getFullAccessProductDetails,
  isAndroidBillingAvailable,
  type FullAccessProductDetails,
} from "../lib/proUpgrade";

export type FullAccessPriceState =
  | { status: "web"; product: null }
  | { status: "loading"; product: null }
  | { status: "available"; product: FullAccessProductDetails }
  | { status: "unavailable"; product: null };

export function useFullAccessProduct(): FullAccessPriceState {
  const androidBilling = isAndroidBillingAvailable();
  const [state, setState] = useState<FullAccessPriceState>(() =>
    androidBilling
      ? { status: "loading", product: null }
      : { status: "web", product: null },
  );

  useEffect(() => {
    if (!androidBilling) {
      setState({ status: "web", product: null });
      return;
    }

    let active = true;
    setState({ status: "loading", product: null });
    getFullAccessProductDetails()
      .then((product) => {
        if (!active) return;
        setState(
          product
            ? { status: "available", product }
            : { status: "unavailable", product: null },
        );
      })
      .catch((error) => {
        console.error("[Full Access] Unable to load Play product details", error);
        if (active) setState({ status: "unavailable", product: null });
      });

    return () => {
      active = false;
    };
  }, [androidBilling]);

  return state;
}
