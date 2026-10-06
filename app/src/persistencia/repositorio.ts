/**
 * Instância única do repositório usada pela aplicação. Trocar a persistência
 * (ex.: por um backend) é trocar SÓ esta linha por outra implementação de
 * `RepositorioProjetos`.
 */
import { CATALOGO } from '../data/catalogo'
import { RepositorioIndexedDB } from './RepositorioIndexedDB'
import type { RepositorioProjetos } from './RepositorioProjetos'

export const repositorio: RepositorioProjetos = new RepositorioIndexedDB(Object.keys(CATALOGO))
