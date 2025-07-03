function shouldSaveBinData(bin_level) {
  if (bin_level >= 85 && bin_level <= 90) {
    return "save_once";
  } else if (bin_level >= 91 && bin_level <= 99) {
    return "save_always";
  }
  return "ignore";
}

module.exports = { shouldSaveBinData };
