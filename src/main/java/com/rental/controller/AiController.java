package com.rental.controller;

import com.rental.dto.ChatRequest;
import com.rental.dto.RecommendationRequest;
import com.rental.service.AiChatService;
import com.rental.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** AI capabilities: natural-language assistant + rule-based recommendation engine. */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiChatService aiChatService;
    private final RecommendationService recommendationService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@Valid @RequestBody ChatRequest req) {
        return ResponseEntity.ok(Map.of("reply", aiChatService.chat(req.getMessage())));
    }

    @PostMapping("/recommend")
    public ResponseEntity<List<RecommendationService.Recommendation>> recommend(@RequestBody RecommendationRequest req) {
        return ResponseEntity.ok(recommendationService.recommend(req));
    }
}
