import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "ab_visitor_id";

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

interface ABTestConfig<V extends string> {
  testName: string;
  variants: V[];
}

export function useABTest<V extends string>({ testName, variants }: ABTestConfig<V>) {
  const [variant, setVariant] = useState<V | null>(null);
  const impressionTracked = useRef(false);
  const visitorId = useRef(getVisitorId());

  useEffect(() => {
    const load = async () => {
      // Check existing assignment
      const { data } = await supabase
        .from("ab_test_assignments")
        .select("variant")
        .eq("visitor_id", visitorId.current)
        .eq("test_name", testName)
        .maybeSingle();

      if (data) {
        setVariant(data.variant as V);
        return;
      }

      // Assign random variant
      const chosen = variants[Math.floor(Math.random() * variants.length)];
      await supabase.from("ab_test_assignments").insert({
        visitor_id: visitorId.current,
        test_name: testName,
        variant: chosen,
      });
      setVariant(chosen);
    };

    load();
  }, [testName]);

  const trackEvent = useCallback(
    async (eventType: string) => {
      if (!variant) return;
      await supabase.from("ab_test_events").insert({
        visitor_id: visitorId.current,
        test_name: testName,
        variant,
        event_type: eventType,
      });
    },
    [variant, testName]
  );

  // Track impression once
  useEffect(() => {
    if (variant && !impressionTracked.current) {
      impressionTracked.current = true;
      trackEvent("impression");
    }
  }, [variant, trackEvent]);

  const trackClick = useCallback(() => trackEvent("click"), [trackEvent]);

  return { variant, trackClick };
}
