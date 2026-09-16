-- Portal TI — Xanxerê
-- Execute no Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists categories (id uuid primary key default gen_random_uuid(), name text unique not null, sort_order int not null default 0, active boolean not null default true);
create table if not exists links (id uuid primary key default gen_random_uuid(), category_id uuid references categories(id) on delete set null, name text not null, url text not null, description text default '', sort_order int not null default 0, active boolean not null default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists profiles (id uuid primary key references auth.users(id) on delete cascade, role text not null default 'user' check(role in ('user','admin')));
create table if not exists favorites (user_id uuid references auth.users(id) on delete cascade, link_id uuid references links(id) on delete cascade, primary key(user_id,link_id));

insert into categories(name,sort_order) values
('Administrativo',1),
('Rede',2),
('Manuais',3),
('Telefonia',4),
('Softwares',5),
('Termos',6),
('Reconhecimento de curso',7),
('Planejamento',8),
('SENHAS',9),
('Datashow',10),
('Contratos OBC',11)
on conflict(name) do update set sort_order=excluded.sort_order;

-- Os links abaixo são a migração exata dos destinos existentes na planilha.
insert into links(category_id,name,url,description,sort_order) select id,'Levantamento Centrais Telefonicas - Ramais VoIP','file:///\\\\arquivos\\ti\\G_Xanxere_TI\\Documentação\\Manuais\\Central%20Telefonica\\Levantamento%20Centrais%20Telefonicas.xlsx','Levantamento das centrais telefônicas e ramais VoIP.',1 from categories where name='Telefonia';
insert into links(category_id,name,url,description,sort_order) select id,'Controle de Linhas ViVo e Aparelhos Celulares','file:///\\\\arquivos\\ti\\G_Xanxere_TI\\Documentação\\Manuais\\Central%20Telefonica\\Controle%20linhas%20da%20VIVO%20+%20Aparelhos.xlsx','Controle de linhas Vivo e aparelhos celulares.',2 from categories where name='Telefonia';
insert into links(category_id,name,url,description,sort_order) select id,'Diagrama - Switchs Gerenciaveis + Portas','file:///\\\\arquivos\\ti\\G_Xanxere_TI\\Documentação\\Redes\\Diagramas\\Diagrama_%20Rede_Xanxere_infra_SW_Gerenciaveis_Portas.vsdx','Diagrama de switches gerenciáveis e suas portas.',3 from categories where name='Rede';
insert into links(category_id,name,url,description,sort_order) select id,'Comandos - Configurar Switch Extreme','file:///\\\\arquivos\\ti\\G_Xanxere_TI\\Documentação\\Redes\\Conf%20Switchs%20Gerenciaveis\\Comandos%20Extreme.docx','Comandos para configuração dos switches Extreme.',4 from categories where name='Rede';
insert into links(category_id,name,url,description,sort_order) select id,'Diagrama - Rede Xanxerê Geral','file:///\\\\arquivos\\ti\\G_Xanxere_TI\\Documentação\\Redes\\Diagramas\\Diagrama_Rede_UNOESC_Xanxerê_Geral.vsdx','Diagrama geral da rede de Xanxerê.',5 from categories where name='Rede';
insert into links(category_id,name,url,description,sort_order) select id,'Reiniciar porta POE - Switch Extreme 220','file:///\\\\arquivos\\ti\\G_Xanxere_TI\\Documentação\\Redes\\Reiniciando%20apenas%201%20porta%20do%20Switch%20PoE%20Extreme%20220.docx','Procedimento para reiniciar uma porta PoE do Extreme 220.',6 from categories where name='Rede';
insert into links(category_id,name,url,description,sort_order) select id,'Levantamento Equipamentos Xanxerê','Levantamento%20equipamento%20XXE.xlsx','Levantamento de equipamentos de TI do campus Xanxerê.',7 from categories where name='Administrativo';
insert into links(category_id,name,url,description,sort_order) select id,'Levantamento Equipamentos Xaxim','Levantamento%20equipamento%20XXM.xlsx','Levantamento de equipamentos de TI de Xaxim.',8 from categories where name='Administrativo';
insert into links(category_id,name,url,description,sort_order) select id,'Levantamento Nobreks','NoBreak%20-%20Levantamento.xlsx','Levantamento dos nobreaks.',9 from categories where name='Administrativo';
insert into links(category_id,name,url,description,sort_order) select id,'Termo Responsabilidade rede IoT','Termo%20de%20Responsabilidade%20rede%20IoT%20-%20JBA.docx','Termo de responsabilidade para uso da rede IoT.',10 from categories where name='Termos';
insert into links(category_id,name,url,description,sort_order) select id,'Termo Emprestimo de Equipamentos','Portaria_nº15_LGPD_-_Política_de_Uso_dos_Equipamentos_de_Informática_e_Rede.pdf','Política/termo relacionado ao uso de equipamentos e rede.',11 from categories where name='Termos';
insert into links(category_id,name,url,description,sort_order) select id,'Kaspersky','Kaspersky%20-%20Caminho%20de%20Instalação,%20senhas%20e%20qtd%20micros%20instalados.xlsx','Caminho de instalação, senhas e quantidade de micros instalados.',12 from categories where name='Softwares';
insert into links(category_id,name,url,description,sort_order) select id,'Acesso aos Servidores e Sistemas','Acesso%20aos%20SERVIDORES%20e%20SISTEMAS.xlsx','Informações de acesso aos servidores e sistemas.',13 from categories where name='Administrativo';
insert into links(category_id,name,url,description,sort_order) select id,'Arquivos para Reconhecimento de Curso','../Reconhecimento%20Curso','Pasta de arquivos para processos de reconhecimento de curso.',14 from categories where name='Reconhecimento de curso';
insert into links(category_id,name,url,description,sort_order) select id,'Softwares por Laboratórios e Setores','../Softwares%20e%20Licenças/Levantamento%20Softwares%20por%20Laboratorio-Setores.xlsx','Levantamento de softwares por laboratório e setor.',15 from categories where name='Softwares';
insert into links(category_id,name,url,description,sort_order) select id,'Controle Contratos Software','../Softwares%20e%20Licenças/Controle%20De%20Softwares/Controle%20CONTRATOS_SOFTWARE%20Xanxerê.xlsx','Controle de contratos de software.',16 from categories where name='Softwares';
insert into links(category_id,name,url,description,sort_order) select id,'Quantidade de Comoputadores e Impressoras','Atualização%20Micros%20e%20Impressoras%20Xanxerê%20e%20Xaxim.xlsx','Quantidade de computadores e impressoras de Xanxerê e Xaxim.',17 from categories where name='Administrativo';
insert into links(category_id,name,url,description,sort_order) select id,'Checklist PC Adm - Programas e Configurações','Checklist%20instalação%20micros%20ADM.docx','Checklist de instalação, programas e configurações de computadores administrativos.',18 from categories where name='Administrativo';
insert into links(category_id,name,url,description,sort_order) select id,'Planejamento 2027','../Planejamento/Planejamento%202027.xlsx','Planejamento de TI para 2027.',19 from categories where name='Planejamento';
insert into links(category_id,name,url,description,sort_order) select id,'Planejamento 2026','../Planejamento/Planejamento%202026.xlsx','Planejamento de TI para 2026.',20 from categories where name='Planejamento';
insert into links(category_id,name,url,description,sort_order) select id,'Manual para Desligar os SERVIDORES','../Manuais/Manual%20para%20desligar%20SERVIDORES.docx','Procedimento para desligamento dos servidores.',21 from categories where name='Manuais';
insert into links(category_id,name,url,description,sort_order) select id,'Manual para Ligar a Mesa de Som ANFITEATRO','../Manuais/MANUAL%20PARA%20LIGAR%20O%20SISTEMA%20DE%20SOM%20DO%20ANFITEATRO.pdf','Procedimento para ligar o sistema de som do anfiteatro.',22 from categories where name='Manuais';
insert into links(category_id,name,url,description,sort_order) select id,'Manual PH Software - Lab Contabeis','../Manuais/PH%20Softwares.docx','Manual do PH Software utilizado no laboratório de contábeis.',23 from categories where name='Manuais';
insert into links(category_id,name,url,description,sort_order) select id,'Limpar Cache Navegadores','../Manuais/Como%20limpar%20o%20cache%20do%20seu%20navegador.pdf','Orientação para limpar o cache dos navegadores.',24 from categories where name='Manuais';
insert into links(category_id,name,url,description,sort_order) select id,'Fluxograma das Demandas','Fluxograma%20Demandas.vsdx','Fluxograma do processo de demandas de TI.',25 from categories where name='Administrativo';
insert into links(category_id,name,url,description,sort_order) select id,'Senhas DVRs','Senhas%20DVR%20Expressivo%20XXE%20e%20UNOESC%20XXM.docx','Informações de acesso dos DVRs.',26 from categories where name='SENHAS';
insert into links(category_id,name,url,description,sort_order) select id,'Levantamento Datashow','Levantamento%20Datashow.xlsx','Levantamento dos equipamentos Datashow.',27 from categories where name='Datashow';
insert into links(category_id,name,url,description,sort_order) select id,'Senhas','file:///K:\\TI\\Manual.txt','Arquivo de referência para senhas.',28 from categories where name='SENHAS';
insert into links(category_id,name,url,description,sort_order) select id,'Ficha de acesso a rede e uso dos computadores','Termo_de_Responsabilidade_Computadores.doc','Ficha/termo para acesso à rede e uso dos computadores.',29 from categories where name='Termos';
insert into links(category_id,name,url,description,sort_order) select id,'Orientações Contratos OBC','file:///\\\\arquivos\\ti\\G_Xanxere_TI\\Documentação\\Contratos\\OBC','Pasta com orientações e documentação de contratos OBC.',30 from categories where name='Contratos OBC';

alter table categories enable row level security; alter table links enable row level security; alter table profiles enable row level security; alter table favorites enable row level security;
create policy 'public read active categories' on categories for select using(active=true);
create policy 'public read active links' on links for select using(active=true);
create policy 'users read own profile' on profiles for select using(auth.uid()=id);
create policy 'users manage own favorites' on favorites for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
-- Para CRUD administrativo, crie um usuário em Auth, insira o id dele em profiles com role=admin e acrescente políticas de insert/update/delete condicionadas ao role admin.
