"""
Regression tests for previously fixed bugs in PLC AutoConfig.
Tests ensure crash-prone operations handle edge cases gracefully.
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))

from index import _format_research_for_analysis, _sanitize_to_ascii


@pytest.mark.asyncio
async def test_format_for_analysis_missing_keys():
    """Test WebResearcher.format_for_analysis with incomplete dict (missing permits_found, etc.)."""
    # Call with minimal dict missing many keys
    incomplete_dict = {
        "community_name": "Test Community",
        "website_url": "https://example.com"
        # Missing permits_found, fee_schedule, departments, ordinances, etc.
    }

    # Should not crash
    result = _format_research_for_analysis(incomplete_dict)
    assert isinstance(result, str)
    assert "Test Community" in result
    assert "example.com" in result


@pytest.mark.asyncio
async def test_format_for_analysis_empty_research():
    """Test WebResearcher.format_for_analysis with empty dict."""


    # Call with empty dict
    result = _format_research_for_analysis({})

    # Should not crash, should return a string
    assert isinstance(result, str)


@pytest.mark.asyncio
async def test_format_for_analysis_with_special_chars():
    """Test WebResearcher.format_for_analysis with special characters."""


    research = {
        "community_name": "Test™ Community®",
        "website_url": "https://example.com",
        "permits_found": [
            {"name": "Building Permit™", "description": "Test © permit", "typical_timeline": "2-6 weeks"}
        ],
        "departments": [
            {"name": "Dept™", "description": "Test description ©", "phone": "(555) 555-0100"}
        ]
    }

    # Should handle special characters gracefully
    result = _format_research_for_analysis(research)
    assert isinstance(result, str)
    assert len(result) > 0


@pytest.mark.asyncio
async def test_sanitize_to_ascii_cyrillic():
    """Test _sanitize_to_ascii with Cyrillic text converts to ASCII."""
    # Cyrillic С (looks like Latin C) and А (looks like Latin A)
    cyrillic_text = "СА test"  # Cyrillic C and A

    result = _sanitize_to_ascii(cyrillic_text)

    # Should be ASCII only
    assert all(ord(c) < 128 for c in result)
    assert "test" in result.lower()


@pytest.mark.asyncio
async def test_sanitize_to_ascii_mixed():
    """Test _sanitize_to_ascii with mixed Cyrillic and special characters."""
    text = "Test — word • with \"quotes\" and Cyrillic С"

    result = _sanitize_to_ascii(text)

    # Should be ASCII only
    assert all(ord(c) < 128 for c in result)
    # Should preserve readable content
    assert "Test" in result
    assert "word" in result


@pytest.mark.asyncio
async def test_sanitize_to_ascii_empty():
    """Test _sanitize_to_ascii with empty string."""
    result = _sanitize_to_ascii("")

    # Should handle gracefully
    assert isinstance(result, str)
    assert result == ""


@pytest.mark.asyncio
async def test_sanitize_to_ascii_none():
    """Test _sanitize_to_ascii with None input."""
    result = _sanitize_to_ascii(None)

    # Should handle gracefully (early return)
    assert result is None


@pytest.mark.asyncio
async def test_sanitize_to_ascii_long_text():
    """Test _sanitize_to_ascii with very long text."""
    # Create a long text with mixed content
    long_text = "Test content. " * 10000  # ~140KB of repeated text

    result = _sanitize_to_ascii(long_text)

    # Should process without crash
    assert isinstance(result, str)
    assert len(result) > 0


@pytest.mark.asyncio
async def test_sanitize_to_ascii_special_chars():
    """Test _sanitize_to_ascii with common special characters."""
    text = "Copyright © 2024™ — Test/Example • Café naïve 50° 1/2"

    result = _sanitize_to_ascii(text)

    # Should be ASCII only
    assert all(ord(c) < 128 for c in result)
    # Should have converted to ASCII equivalents
    assert "(c)" in result or "c" in result.lower()  # Copyright symbol
    assert "deg" in result or "°" not in result  # Degree symbol


@pytest.mark.asyncio
async def test_sanitize_to_ascii_unicode_urls():
    """Test _sanitize_to_ascii with Unicode in URLs."""
    text = "Visit https://example.com/café for more info"

    result = _sanitize_to_ascii(text)

    # Should be ASCII only
    assert all(ord(c) < 128 for c in result)
    assert "example.com" in result


@pytest.mark.asyncio
async def test_format_for_analysis_all_fields():
    """Test WebResearcher.format_for_analysis with all possible fields."""


    research = {
        "community_name": "Test City",
        "website_url": "https://testcity.gov",
        "research_summary": "Comprehensive research completed",
        "permits_found": [
            {
                "name": "Building Permit",
                "description": "For new construction",
                "typical_timeline": "2-6 weeks"
            }
        ],
        "fee_schedule": [
            {
                "permit_type": "Building",
                "fee_name": "Application Fee",
                "amount": "$250",
                "notes": "Non-refundable"
            }
        ],
        "departments": [
            {
                "name": "Planning Department",
                "description": "Handles permits",
                "phone": "(555) 555-0100"
            }
        ],
        "ordinances": [
            {
                "code": "Title 15",
                "summary": "Building code",
                "key_provisions": ["Permit required", "Plans needed"]
            }
        ],
        "processes": [
            {
                "name": "Building Permit Process",
                "steps": ["Submit application", "Review", "Approve", "Issue permit"]
            }
        ],
        "documents_commonly_required": [
            "Application form",
            "Site plan",
            "Architectural plans"
        ]
    }

    result = _format_research_for_analysis(research)

    # Should be a string with all content
    assert isinstance(result, str)
    assert "Test City" in result
    assert "Building Permit" in result
    assert "Planning Department" in result
    assert "Title 15" in result
    assert "Application form" in result
