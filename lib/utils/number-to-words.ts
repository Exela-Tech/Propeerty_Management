export function numberToWords(num: number): string {
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ]
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
  const scales = ["", "thousand", "million", "billion"]

  if (num === 0) return "zero"

  const parts: string[] = []
  let scaleIndex = 0

  while (num > 0) {
    const chunk = num % 1000
    if (chunk !== 0) {
      parts.unshift(convertChunk(chunk) + (scaleIndex > 0 ? " " + scales[scaleIndex] : ""))
    }
    num = Math.floor(num / 1000)
    scaleIndex++
  }

  return parts.join(" ")

  function convertChunk(n: number): string {
    let result = ""

    const hundreds = Math.floor(n / 100)
    if (hundreds > 0) {
      result += ones[hundreds] + " hundred"
    }

    const remainder = n % 100
    if (remainder > 0) {
      if (result) result += " "
      if (remainder < 10) {
        result += ones[remainder]
      } else if (remainder < 20) {
        result += teens[remainder - 10]
      } else {
        result += tens[Math.floor(remainder / 10)]
        const unit = remainder % 10
        if (unit > 0) {
          result += " " + ones[unit]
        }
      }
    }

    return result
  }
}
