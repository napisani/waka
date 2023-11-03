
const configTemplate = {
  installPreEvaluate: async () => {
    console.log('install pre evaluate');

  },
  installPreWrite: async () => {
    console.log('install pre write');
    // install pre write
  },
  installPostWrite: async () => {
    // install post write
    console.log('install post write');
  },
  applyPreEvaluate: async () => {
    // apply pre evaluate
    console.log('apply pre evaluate');
  },
  applyPreWrite: async () => {
    // apply pre write
    console.log('apply pre write');
  },
  applyPostWrite: async () => {
    // apply post write
    console.log('apply post write');
  },
};
module.exports = configTemplate;
