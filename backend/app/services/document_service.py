"""Document analysis and orchestration service for BillSaathi and ProofPath."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from app.config import settings
from app.schemas.common import AppLanguage, WorkflowType, DocumentType
from app.schemas.document import DocumentAnalysisResponse, StorageMetadata
from app.services.image_service import validate_and_normalize_image
from app.services.gemma_service import gemma_service
from app.services.bill_service import process_bill_extraction
from app.services.action_service import process_general_document_extraction
from app.services.cloudinary_service import cloudinary_service
from app.repositories.documents import documents_repo
from app.repositories.actions import actions_repo


class DocumentService:
    @staticmethod
    async def analyze_document(
        raw_bytes: bytes,
        workflow: WorkflowType,
        language: AppLanguage,
        owner_id: str,
        filename: str = "",
    ) -> DocumentAnalysisResponse:
        """
        Validate, normalize, classify, extract, and persist document.
        """
        # 1. Normalize image
        normalized_bytes, mime_type, width, height = validate_and_normalize_image(raw_bytes, filename)

        # 2. Upload to Cloudinary authenticated storage if configured
        cld_asset = cloudinary_service.upload_private_document(normalized_bytes, mime_type)
        cld_public_id = cld_asset.get("public_id") if cld_asset else None

        doc_id = f"doc_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        try:
            # 3. Process workflow
            if workflow == WorkflowType.BILL:
                extracted_bill = await gemma_service.extract_bill(normalized_bytes, mime_type, language)
                fields, warnings = process_bill_extraction(extracted_bill)

                summary = extracted_bill.summary or (
                    f"Electricity bill analyzed. Amount due: "
                    + next((f.value for f in fields if f.key == "amount_due"), "not found")
                )
                actions_list = []
                doc_type = DocumentType.ELECTRICITY_BILL
            else:
                extracted_doc = await gemma_service.extract_general_document(normalized_bytes, mime_type, language)
                fields, actions_list, warnings = process_general_document_extraction(extracted_doc, doc_id)

                summary = extracted_doc.summary
                doc_type = DocumentType.PENSION_NOTICE

                # Persist extracted actions
                for a in actions_list:
                    a_with_owner = dict(a)
                    a_with_owner["owner_id"] = owner_id
                    await actions_repo.insert_action(a_with_owner)

            # 4. Build Storage Metadata
            storage_meta = StorageMetadata(
                provider="cloudinary",
                original_stored=settings.store_original_documents,
                asset_id=cld_asset.get("asset_id") if cld_asset else None,
                public_id=cld_public_id if settings.store_original_documents else None,
                resource_type="image",
                delivery_type=settings.cloudinary_document_delivery_type,
            )

            # 5. Persist document record to DB
            doc_record = {
                "id": doc_id,
                "_id": doc_id,
                "owner_id": owner_id,
                "workflow": workflow.value,
                "document_type": doc_type.value,
                "language": language.value,
                "summary": summary,
                "fields": [f.model_dump() for f in fields],
                "warnings": warnings,
                "actions": actions_list,
                "storage": storage_meta.model_dump(),
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            await documents_repo.insert_document(doc_record)

            return DocumentAnalysisResponse(
                document_id=doc_id,
                workflow=workflow,
                document_type=doc_type,
                language=language,
                summary=summary,
                fields=fields,
                warnings=warnings,
                actions=actions_list,
                storage=storage_meta,
                created_at=now_iso,
            )

        finally:
            # Clean up Cloudinary temporary document scan unless retention is enabled
            if not settings.store_original_documents and cld_public_id:
                cloudinary_service.delete_document(cld_public_id)


document_service = DocumentService()
