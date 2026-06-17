import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: './openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/api/generated/api.ts',
      schemas: './src/api/generated/types',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,  
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
    
  },
})
