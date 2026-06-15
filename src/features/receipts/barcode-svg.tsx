import * as React from "react";
import JsBarcode from "jsbarcode";

export function BarcodeSVG({
  value,
  height = 40,
  fontSize = 12,
  width = 1.5,
}: {
  value: string;
  height?: number;
  fontSize?: number;
  width?: number;
}) {
  const ref = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        displayValue: true,
        fontSize,
        height,
        width,
        margin: 4,
      });
    } catch {
      // ignore invalid values
    }
  }, [value, height, fontSize, width]);

  return <svg ref={ref} />;
}
