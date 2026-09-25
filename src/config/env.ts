// .env exists only locally; in production (Render) variables come from the platform.
// A missing required key is still caught by required() below.
try {
  process.loadEnvFile()
} catch {
  // no .env file — use process.env as is
}

 function required(name: string): string { 
    const value = process.env[name]
    if(!value){
throw new Error(`Missing env variable: ${name}`)
    }
    return value
   }
function parsePort(value: string): number {
  const port = Number(value)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid PORT: "${value}"`)
    }
    return port
 }

export const env = {
  port: parsePort(required('PORT')),
  corsOrigin: required('CORS_ORIGIN'),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
}