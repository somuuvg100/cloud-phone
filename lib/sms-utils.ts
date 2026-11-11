/**
 * GSM-7 and UCS-2 SMS Segment and Character Calculation Utilities
 */

// GSM-7 Basic Character Set Regex
const GSM_7_REGEX = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~\]|€]*$/;

export interface SmsMetrics {
  charCount: number;
  encoding: "GSM-7" | "UCS-2";
  segmentCount: number;
  maxCharsPerSegment: number;
  charsRemainingInSegment: number;
  estimatedCostUsd: string;
}

/**
 * Calculates SMS segment count, encoding, and remaining characters based on telecom standards
 */
export function calculateSmsMetrics(text: string, ratePerSegment = 0.0079): SmsMetrics {
  const charCount = text.length;

  if (charCount === 0) {
    return {
      charCount: 0,
      encoding: "GSM-7",
      segmentCount: 1,
      maxCharsPerSegment: 160,
      charsRemainingInSegment: 160,
      estimatedCostUsd: ratePerSegment.toFixed(4),
    };
  }

  // Detect encoding: if all characters belong to GSM-7, use GSM-7; otherwise UCS-2 (Unicode)
  const isGsm7 = GSM_7_REGEX.test(text);
  const encoding = isGsm7 ? "GSM-7" : "UCS-2";

  let segmentCount = 1;
  let maxCharsPerSegment = 160;
  let charsRemainingInSegment = 160;

  if (encoding === "GSM-7") {
    if (charCount <= 160) {
      segmentCount = 1;
      maxCharsPerSegment = 160;
      charsRemainingInSegment = 160 - charCount;
    } else {
      // Concatenated GSM-7 uses 153 characters per segment due to UDH (User Data Header)
      segmentCount = Math.ceil(charCount / 153);
      maxCharsPerSegment = 153;
      charsRemainingInSegment = segmentCount * 153 - charCount;
    }
  } else {
    // UCS-2 (Unicode / Emojis)
    if (charCount <= 70) {
      segmentCount = 1;
      maxCharsPerSegment = 70;
      charsRemainingInSegment = 70 - charCount;
    } else {
      // Concatenated UCS-2 uses 67 characters per segment
      segmentCount = Math.ceil(charCount / 67);
      maxCharsPerSegment = 67;
      charsRemainingInSegment = segmentCount * 67 - charCount;
    }
  }

  const estimatedCostUsd = (segmentCount * ratePerSegment).toFixed(4);

  return {
    charCount,
    encoding,
    segmentCount,
    maxCharsPerSegment,
    charsRemainingInSegment,
    estimatedCostUsd,
  };
}

