# Project Maintenance Checklist

## Purpose
Use this checklist whenever the app changes so code, behavior, and documentation stay aligned.

## Change Checklist
- Verify the actual user-facing behavior in both `frontend/` and `backend/` matches the intended change.
- Keep beginner-facing setup and startup steps accurate for both Windows and macOS when scripts or install commands change.
- Update [HEIC_TO_JPG_APP_ARCHITECTURE.md](/Users/mahesh/Downloads/Convert%20Iphone%20images%20to%20JPJ%20Format/HEIC_TO_JPG_APP_ARCHITECTURE.md) if any of these changed:
  - app flow
  - backend endpoints
  - shared vs local state behavior
  - job lifecycle
  - duplicate handling
  - supported file formats
  - deletion rules
  - cross-device behavior
- Check whether the change affects how phone and laptop clients interact on the same network.
- Confirm any new settings are reflected in the UI description and architecture notes.
- Confirm any new backend-only state is documented as shared state.
- Confirm any browser-only state is documented as local state.
- Run the relevant app tests or manual validation before considering the change complete.

## Documentation Rule
`HEIC_TO_JPG_APP_ARCHITECTURE.md` is the source of truth for:
- current app functionality
- frontend/backend responsibilities
- API surface
- cross-device behavior
- storage model and limitations

If code changes one of those areas, update the architecture file in the same change.

## Sync Rule
When we implement or change anything meaningful in the app, we should keep these files in sync in the same change whenever applicable:

- `README.md`
- `HEIC_TO_JPG_APP_ARCHITECTURE.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md` when the maintenance process itself changes
