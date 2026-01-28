/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  options: {
    /* Usa tsconfig para alias */
    tsConfig: {
      fileName: './tsconfig.json',
    },
    /* Evita node_modules */
    doNotFollow: {
      path: 'node_modules',
    },
    /* Módulos soportados */
    moduleSystems: ['cjs', 'es6', 'tsd'],
  },
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Ciclo detectado.',
      from: {},
      to: {
        circular: true,
      },
    }
  ],
};