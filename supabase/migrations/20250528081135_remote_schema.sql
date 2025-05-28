set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_meta JSONB;
BEGIN
 
  IF auth.uid() IS NULL THEN
    RETURN NULL; 
  END IF;

  -- Intenta obtener los metadatos del usuario.
  -- Usamos un bloque EXCEPTION para manejar el caso donde el usuario de auth.uid()
  -- podría no existir ya en auth.users (aunque es raro en flujos normales)
  -- o si raw_user_meta_data es null.
  BEGIN
    SELECT raw_user_meta_data INTO user_meta FROM auth.users WHERE id = auth.uid();
  EXCEPTION WHEN NO_DATA_FOUND THEN
    user_meta := NULL;
  END;
  
  IF user_meta IS NULL OR NOT (user_meta ? 'role') THEN
    RETURN NULL; -- El usuario no tiene metadatos, la clave 'role', o no existe en auth.users.
  END IF;
  
  RETURN user_meta->>'role';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error fetching user role: %', SQLERRM;
  RETURN NULL;
END;
$function$
;

create policy "Admins can create events"
on "public"."events"
as permissive
for insert
to authenticated
with check ((get_user_role() = 'admin'::text));


create policy "Admins can manage all events"
on "public"."events"
as permissive
for all
to authenticated
using ((get_user_role() = 'admin'::text))
with check ((get_user_role() = 'admin'::text));


create policy "Public can view active events"
on "public"."events"
as permissive
for select
to public
using ((is_active = true));



