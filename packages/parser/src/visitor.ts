import type * as swc from '@swc/core'
import BaseVisitor from '@swc/core/Visitor'
import * as ast from './ast'
import { ImportResult, PluginContext } from './types'

export class CallVisitor extends BaseVisitor {
  constructor(private ctx: PluginContext) {
    super()
  }

  import: ImportResult | undefined

  visitImportDeclaration(node: swc.ImportDeclaration): swc.ImportDeclaration {
    this.import = ast.importDeclaration(node, this.ctx.import)
    return node
  }

  visitCallExpression(node: swc.CallExpression): swc.Expression {
    // bail out if the function we're interested in has not been called
    if (!this.import) return node

    const expression = ast.callExpression(node, this.import.alias)
    if (!expression) return node

    const args = expression.arguments
    if (!args.length || args.length > 2) return node

    if (args.length === 2) {
      //
      const [name, config] = args

      if (name.expression.type === 'StringLiteral' && config.expression.type === 'ObjectExpression') {
        this.ctx.onData({
          type: 'named-object',
          name: name.expression.value,
          data: ast.objectExpression(config.expression),
        })
      }

      return node
    }

    const [config] = args

    if (config.expression.type === 'ObjectExpression') {
      this.ctx.onData({
        type: 'object',
        data: ast.objectExpression(config.expression),
      })
    }

    return node
  }
}