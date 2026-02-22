## DELETE /api/v1/materials/categories/:id

This file contains two suggested implementations for the backend route that deletes a material category.

- A simple safe variant that rejects deletion if material types exist.
- A `force=true` cascaded variant implemented with a MongoDB transaction (recommended when you want atomic cascade deletes).

Paste one of these into your materials router file (the file you shared earlier) next to the other `/categories` routes.

---

1) Simple variant (no cascade)

```ts
// DELETE /api/v1/materials/categories/:id
materialRouter.delete(
  "/categories/:id",
  requirePermission("materials:delete"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.id as string;

      // Prevent delete if there are types referencing this category
      const typeCount = await MaterialModel.countDocuments({ categoryId });
      if (typeCount > 0) {
        return next(
          AppError.badRequest(
            "Cannot delete category with existing material types",
            { typeCount },
          ),
        );
      }

      const category = await Category.findByIdAndDelete(categoryId);
      if (!category) return next(AppError.notFound("Category not found"));

      res.json({ status: "success", message: "Category deleted successfully" });
    } catch (err) {
      next(err);
    }
  },
);
```

2) Force cascade delete (transactional, deletes instances and types)

Notes:
- Requires MongoDB replica set or server that supports transactions.
- Uses a Mongoose session and attempts an atomic cascade: delete instances -> delete types -> delete category.

```ts
// DELETE /api/v1/materials/categories/:id?force=true
materialRouter.delete(
  "/categories/:id",
  requirePermission("materials:delete"),
  async (req: Request, res: Response, next: NextFunction) => {
    const categoryId = req.params.id as string;
    const force = String(req.query.force) === "true";

    // If not forced, reuse the safe behaviour
    if (!force) {
      try {
        const typeCount = await MaterialModel.countDocuments({ categoryId });
        if (typeCount > 0) {
          return next(
            AppError.badRequest(
              "Cannot delete category with existing material types",
              { typeCount },
            ),
          );
        }

        const category = await Category.findByIdAndDelete(categoryId);
        if (!category) return next(AppError.notFound("Category not found"));

        return res.json({ status: "success", message: "Category deleted" });
      } catch (err) {
        return next(err);
      }
    }

    // Forced cascade with transaction
    const session = await Category.startSession();
    try {
      await session.withTransaction(async () => {
        // Find types in this category
        const types = await MaterialModel.find({ categoryId }).session(session).select("_id");
        const typeIds = types.map((t) => t._id);

        if (typeIds.length > 0) {
          // Delete instances referencing those types
          await MaterialInstance.deleteMany({ modelId: { $in: typeIds } }).session(session);

          // Delete the types themselves
          await MaterialModel.deleteMany({ _id: { $in: typeIds } }).session(session);

          // Adjust organization counters if necessary
          try {
            await organizationService.decrementCatalogItemCount(getOrgId(req), typeIds.length);
          } catch (svcErr) {
            // best-effort: if this fails, the transaction will still roll back
            throw svcErr;
          }
        }

        // Delete the category
        const category = await Category.findOneAndDelete({ _id: categoryId }).session(session);
        if (!category) throw AppError.notFound("Category not found");
      });

      session.endSession();
      return res.json({ status: "success", message: "Category and dependents deleted" });
    } catch (err) {
      session.endSession();
      return next(err);
    }
  },
);
```

---

Curl test commands

Replace `$BASE` and `$TOKEN` as needed.

List categories:
```bash
curl -sS -H "Accept: application/json" "$BASE/api/v1/materials/categories" | jq .
```

Delete (safe):
```bash
curl -i -X DELETE "$BASE/api/v1/materials/categories/<CATEGORY_ID>" -H "Authorization: Bearer $TOKEN"
```

Force delete (cascades):
```bash
curl -i -X DELETE "$BASE/api/v1/materials/categories/<CATEGORY_ID>?force=true" -H "Authorization: Bearer $TOKEN"
```

Integration notes

- If your `organizationService.decrementCatalogItemCount` signature accepts only `orgId`, adapt the call to decrement in a loop or implement a new helper that accepts a count.
- If your MongoDB deployment does not support transactions, use the simple variant or implement compensating operations.
- Consider restricting `force=true` to privileged roles if you want extra safety.

If you want I can also generate a git patch (diff) file for you to apply directly to your backend repo — drop the repo here or tell me the router file path and I'll create the patch.
