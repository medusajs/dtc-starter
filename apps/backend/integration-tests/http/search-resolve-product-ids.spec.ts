import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { SearchTypes } from "@medusajs/framework/types"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

import { resolveProductIds } from "../../src/search/helpers/resolve-product-ids"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    describe("resolveProductIds", () => {
      const resolve = (name: string, id: string) => {
        const container = getContainer()

        return resolveProductIds({ name, data: { id } }, {
          container: {
            query: container.resolve(ContainerRegistrationKeys.QUERY),
            logger: container.resolve(ContainerRegistrationKeys.LOGGER),
          },
        } as SearchTypes.SearchIngestionContext)
      }

      const createShirt = async () => {
        const productModule = getContainer().resolve(Modules.PRODUCT)
        const [product] = await productModule.createProducts([
          { title: "Shirt", options: [{ title: "Size", values: ["S", "M"] }] },
        ])
        const { options } = await productModule.retrieveProduct(product.id, {
          relations: ["options", "options.values"],
        })

        return { product, option: options[0] }
      }

      it("maps an updated option and option value to their product", async () => {
        const { product, option } = await createShirt()

        expect(await resolve("product-option.updated", option.id)).toEqual([
          product.id,
        ])
        expect(
          await resolve("product-option-value.updated", option.values[0].id),
        ).toEqual([product.id])
      })

      it("maps a shared option to every product that uses it", async () => {
        const productModule = getContainer().resolve(Modules.PRODUCT)
        const [option] = await productModule.createProductOptions([
          { title: "Color", values: ["Red"] },
        ])
        const [shirt, hoodie] = await productModule.createProducts([
          { title: "Shirt", options: [{ id: option.id }] },
          { title: "Hoodie", options: [{ id: option.id }] },
        ])

        const productIds = await resolve("product-option.updated", option.id)

        expect(productIds.sort()).toEqual([shirt.id, hoodie.id].sort())
      })

      it("maps the options of a deleted product to that product", async () => {
        const { product, option } = await createShirt()

        await deleteProductsWorkflow(getContainer()).run({
          input: { ids: [product.id] },
        })

        expect(await resolve("product-option.deleted", option.id)).toEqual([
          product.id,
        ])
        expect(
          await resolve("product-option-value.deleted", option.values[0].id),
        ).toEqual([product.id])
      })
    })
  },
})
