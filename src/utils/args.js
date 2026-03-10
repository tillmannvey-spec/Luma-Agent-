/**
 * Minimal argument parser for the workflow CLI.
 */
export function parseArgs(argv) {
  const config = {
    prompt: null,
    output: "./output",
    parallel: 5,
    review: true,
    dryRun: false,
    approveVideos: false,
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--prompt":
        config.prompt = argv[++i];
        break;
      case "--output":
        config.output = argv[++i];
        break;
      case "--parallel":
        config.parallel = parseInt(argv[++i], 10);
        break;
      case "--review":
        config.review = argv[++i] !== "false";
        break;
      case "--dry-run":
        config.dryRun = true;
        break;
      case "--approve-videos":
        config.approveVideos = true;
        break;
    }
  }

  return config;
}
