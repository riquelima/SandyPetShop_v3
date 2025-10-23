// Script para adicionar a coluna enrollment_date na tabela daycare_enrollments
// Execute este script no console do navegador ou como um script Node.js

import { supabase } from './supabaseClient.js';

async function addEnrollmentDateColumn() {
    try {
        console.log('Iniciando adição da coluna enrollment_date...');
        
        // Como não podemos executar DDL diretamente via cliente Supabase,
        // vamos verificar se a coluna já existe tentando fazer uma query
        const { data, error } = await supabase
            .from('daycare_enrollments')
            .select('enrollment_date')
            .limit(1);
            
        if (error && error.message.includes('column "enrollment_date" does not exist')) {
            console.log('Coluna enrollment_date não existe. Você precisa executar o seguinte SQL no Supabase Dashboard:');
            console.log(`
ALTER TABLE daycare_enrollments 
ADD COLUMN enrollment_date DATE;

-- Opcional: Definir um valor padrão para registros existentes
UPDATE daycare_enrollments 
SET enrollment_date = CURRENT_DATE 
WHERE enrollment_date IS NULL;
            `);
            
            return false;
        } else if (error) {
            console.error('Erro ao verificar coluna:', error);
            return false;
        } else {
            console.log('Coluna enrollment_date já existe!');
            return true;
        }
        
    } catch (error) {
        console.error('Erro:', error);
        return false;
    }
}

// Executar a função
addEnrollmentDateColumn().then(success => {
    if (success) {
        console.log('✅ Coluna enrollment_date está disponível');
    } else {
        console.log('❌ Coluna enrollment_date precisa ser adicionada manualmente no Supabase Dashboard');
    }
});