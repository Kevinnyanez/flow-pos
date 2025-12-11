# Guía de Migración a Supabase

## ✅ Configuración Completada

Las credenciales de Supabase han sido configuradas en el archivo `.env`:

- **URL**: https://vqfyzuhjyzgedeqizmbu.supabase.co
- **Project ID**: vqfyzuhjyzgedeqizmbu

## 📋 Pasos para Aplicar las Migraciones

Para que la aplicación funcione correctamente, necesitas aplicar las migraciones de la base de datos en tu proyecto de Supabase. Tienes dos opciones:

### Opción 1: Usando la CLI de Supabase (Recomendado)

1. **Instala la CLI de Supabase** (si no la tienes):
   ```bash
   npm install -g supabase
   ```

2. **Inicia sesión en Supabase**:
   ```bash
   supabase login
   ```

3. **Vincula tu proyecto local con tu proyecto de Supabase**:
   ```bash
   supabase link --project-ref vqfyzuhjyzgedeqizmbu
   ```
   Te pedirá tu database password. Puedes encontrarla en tu dashboard de Supabase: Settings > Database > Database Password

4. **Aplica las migraciones**:
   ```bash
   supabase db push
   ```

### Opción 2: Usando el SQL Editor en el Dashboard de Supabase

1. Ve a tu proyecto en https://supabase.com/dashboard/project/vqfyzuhjyzgedeqizmbu
2. Navega a **SQL Editor**
3. Ejecuta cada archivo de migración en orden (según la fecha en el nombre del archivo):
   - `20251202211005_429c485b-6d28-4455-b1b5-61676505a1f1.sql`
   - `20251204001724_5d49bd34-e654-45e9-a6ac-9d31fd812154.sql`
   - `20251204002322_79cf2b91-7b36-4ca5-be97-063d669a165d.sql`
   - `20251206011254_245c0039-d6e2-4afc-b403-7a3bb69850cb.sql`
   - `20251206012323_0d000080-dceb-4bb1-aa49-69bf33d2572a.sql`
   - `20251207210514_f8124f6e-f0b5-4580-b023-f22cbe49dd6d.sql`
   - `20251209142231_fe283645-4adf-41b6-83bc-3801006a65b0.sql`
   - `20251210141743_2e09f854-1dfd-4626-a97b-8f91b07bae85.sql`

## 🔐 Configuración de Row Level Security (RLS)

Las tablas tienen Row Level Security habilitado. Asegúrate de que las políticas estén configuradas correctamente para que los usuarios autenticados puedan acceder a los datos.

## 🧪 Verificar la Conexión

Después de aplicar las migraciones:

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Intenta iniciar sesión en la aplicación

3. Verifica que puedas:
   - Ver productos en Stock
   - Crear ventas
   - Gestionar clientes

## 📝 Notas Importantes

- **Datos existentes**: Si tenías datos en Lovable Cloud, necesitarás migrarlos manualmente o exportarlos desde allí e importarlos en el nuevo proyecto.
- **Autenticación**: Los usuarios necesitarán registrarse nuevamente en el nuevo proyecto de Supabase.
- **Variables de entorno**: El archivo `.env` ya está configurado con tus nuevas credenciales.

## 🆘 Solución de Problemas

Si encuentras errores de conexión:

1. Verifica que el archivo `.env` tenga las credenciales correctas
2. Asegúrate de que las migraciones se hayan aplicado correctamente
3. Verifica las políticas de RLS en el dashboard de Supabase
4. Revisa la consola del navegador para ver errores específicos

